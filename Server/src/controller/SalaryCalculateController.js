import mongoose from "mongoose";
import { SalarySettings } from "../models/SalarySettingSchema.js";
import { SalarySlip } from "../models/SalaryCalculateSchema.js";
import { TaxSlab } from "../models/TaxSlabsSchema.js";
import { Expense } from "../models/ExpenseSchema.js";
import { User } from "../models/UserSchema.js";
import PDFDocument from "pdfkit";
import { RecentActivity } from "../models/RecentActivitySchema.js";
import { SalarySlipRequest } from "../models/SalarySlipRequestSchema.js";
import path from "path";
import fs from "fs";
import { Holiday } from "../models/HolidaySchema.js";
import { Attendance } from "../models/AttendanceSchema.js";
import puppeteer from "puppeteer";
import salarySlipHtml from "../templates/salarySlipHtml.js";
import { convertNumberToWords } from "../utils/numberToWords.js";

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

const normalizeMonth = (raw) => {
  if (!raw && raw !== 0) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{6}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4)}`;
  if (/^\d{1,2}-\d{4}$/.test(s)) {
    const [m, y] = s.split("-");
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  if (/^\d{1,2}$/.test(s)) {
    const monthNum = Number(s);
    if (monthNum >= 1 && monthNum <= 12) {
      const y = new Date().getFullYear();
      return `${y}-${String(monthNum).padStart(2, "0")}`;
    }
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  return null;
};

const toObjectId = (val) => {
  try {
    return new mongoose.Types.ObjectId(val);
  } catch {
    return val;
  }
};

// Progressive tax calculation (unchanged, robust)
const calculateProgressiveTax = (annualIncome, taxSlabs) => {
  if (!taxSlabs || taxSlabs.length === 0) return 0;

  let totalTax = 0;
  let previousMax = 0;

  const sorted = [...taxSlabs].sort(
    (a, b) => (Number(a.minIncome) || 0) - (Number(b.minIncome) || 0)
  );

  for (const slab of sorted) {
    const min = Number(slab.minIncome) || 0;
    const max = slab.maxIncome != null ? Number(slab.maxIncome) : Infinity;
    const rate = Number(slab.taxRate) || 0;

    if (annualIncome <= min) break;

    const taxableStart = Math.max(min, previousMax);
    const taxableEnd = Math.min(annualIncome, max);
    const taxableAmount = taxableEnd - taxableStart;

    if (taxableAmount > 0) {
      totalTax += (taxableAmount * rate) / 100;
    }

    previousMax = Math.max(previousMax, max);
    if (annualIncome <= max) break;
  }

  return round2(totalTax);
};

// Shared helper: compute earnings, deductions, totals & tax
const computeSlipData = async ({
  settings,
  CompanyId,
  EmployeeID,
  Month,
  taxSlabsForMonth,
  preFetchedHolidays, // Optional: Set of date strings
  preFetchedAttendance, // Optional: Map<dateString, status>
}) => {
  // settings: SalarySettings doc with populated SalaryHeads.SalaryHeadId
  if (!settings) throw new Error("Salary settings not found");
  const basicHead = (settings.SalaryHeads || []).find((h) => {
    const shortName = h.SalaryHeadId?.ShortName?.toLowerCase();
    return shortName === "bs" || shortName === "basic";
  });

  if (!basicHead || basicHead.applicableValue == null) {
    throw new Error("Basic salary not configured");
  }

  const basicSalary = Number(basicHead.applicableValue) || 0;
  const earnings = [];
  const deductions = [];

  for (const head of settings.SalaryHeads || []) {
    const sh = head.SalaryHeadId || {};
    let amt = 0;

    if (head.applicableValue != null) {
      amt = Number(head.applicableValue) || 0;
    } else if (head.percentage != null) {
      amt = (Number(head.percentage) / 100) * basicSalary;
    }

    amt = round2(amt);

    const detail = {
      title: sh.SalaryHeadsTitle || "",
      shortName: sh.ShortName || "",
      amount: amt,
    };

    if (String(sh.SalaryHeadsType || "").toLowerCase() === "earnings") {
      earnings.push(detail);
    } else {
      deductions.push(detail);
    }
  }


  // --- ATTENDANCE & LEAVE CALCULATION ---
  const [yearStr, monthStr] = Month.split("-");
  const year = parseInt(yearStr);
  const monthIdx = parseInt(monthStr) - 1;
  const totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  let holidayDates;
  if (preFetchedHolidays) {
    holidayDates = preFetchedHolidays;
  } else {
    // Legacy fallback: fetch if not provided
    const holidays = await Holiday.find({
      CompanyId,
      Date: { $regex: `^${Month}` },
    });
    holidayDates = new Set(holidays.map((h) => h.Date));
  }

  let attendanceMap;
  if (preFetchedAttendance) {
    attendanceMap = preFetchedAttendance;
  } else {
    // Legacy fallback
    const attendanceRecords = await Attendance.find({
      CompanyId,
      UserId: EmployeeID,
      Date: { $regex: `^${Month}` },
    });
    attendanceMap = new Map();
    attendanceRecords.forEach((rec) => attendanceMap.set(rec.Date, rec.Status));
  }

  // --- ATTENDANCE TRACKING ---
  let unpaidDays = 0;
  let presentDays = 0;
  let unpaidLeaveCount = 0;
  let halfDayCount = 0;
  let paidLeaveCount = 0;
  let workingDays = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(Date.UTC(year, monthIdx, d));
    const dateStr = dateObj.toISOString().split("T")[0];
    const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday

    // 1. Sunday -> Skip (not a working day)
    if (dayOfWeek === 0) continue;

    // 2. Holiday -> Skip (not a working day)
    if (holidayDates.has(dateStr)) continue;

    // This is a working day
    workingDays++;

    // 3. Attendance Logic
    if (attendanceMap.has(dateStr)) {
      const status = attendanceMap.get(dateStr);
      if (status === "UnpaidLeave" || status === "Absent") {
        // Both UnpaidLeave and Absent deduct full day salary
        unpaidDays++;
        unpaidLeaveCount++;
      } else if (status === "HalfDay") {
        unpaidDays += 0.5;
        halfDayCount++;
      } else if (status === "PaidLeave") {
        paidLeaveCount++;
      } else if (status === "Present") {
        presentDays++;
      }
      continue;
    }

    // 4. Unmarked days -> No deduction (assume present for small teams)
    // Only explicit "Absent" or "UnpaidLeave" will deduct salary
    // This is safer for 10-12 employee teams where HR might forget to mark
    // unpaidDays++;
    // unpaidLeaveCount++;
  }

  const perDayPay = basicSalary / totalDaysInMonth;
  const leaveDeductionAmount = round2(perDayPay * unpaidDays);

  if (leaveDeductionAmount > 0) {
    deductions.push({
      title: `Leave Deduction (${unpaidDays} days)`,
      shortName: "LWP",
      amount: leaveDeductionAmount,
    });
  }
  // --------------------------------------

  const totalEarnings = round2(earnings.reduce((s, e) => s + e.amount, 0));
  const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));
  const grossSalary = round2(totalEarnings);
  let TaxAmount = 0;

  if (settings.isTaxApplicable) {
    const annual = grossSalary * 12;
    if (Array.isArray(taxSlabsForMonth) && taxSlabsForMonth.length) {
      const annualTax = calculateProgressiveTax(annual, taxSlabsForMonth);
      TaxAmount = round2(annualTax / 12);
    }
  }

  const netSalary = round2(grossSalary - totalDeductions - TaxAmount);

  return {
    CompanyId,
    EmployeeID,
    Month,
    Earnings: earnings,
    Deductions: deductions,
    totalEarnings,
    totalDeductions,
    grossSalary,
    netSalary,
    TaxAmount,
    attendanceSummary: {
      totalWorkingDays: workingDays,
      presentDays,
      unpaidLeaves: unpaidLeaveCount,
      halfDays: halfDayCount,
      paidLeaves: paidLeaveCount,
      leaveDeductionAmount,
    },
  };
};

// -----------------------------
// Single salary calculation (no transactions)
// -----------------------------
const calculateSalary = async (req, res) => {
  try {
    const { EmployeeID, CompanyId, Month } = req.body;
    if (!EmployeeID || !CompanyId || !Month) {
      return res
        .status(400)
        .json({
          success: false,
          message: "EmployeeID, CompanyId, and Month are required",
        });
    }

    const normalizedMonth = normalizeMonth(Month);
    if (!normalizedMonth) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Month format" });
    }

    // Check existing slip
    const existingSlip = await SalarySlip.findOne({
      EmployeeID: toObjectId(EmployeeID),
      CompanyId: toObjectId(CompanyId),
      Month: normalizedMonth,
    });

    if (existingSlip) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Salary slip already exists",
          data: existingSlip,
        });
    }

    // Load settings
    const salarySettings = await SalarySettings.findOne({
      EmployeeID: toObjectId(EmployeeID),
      CompanyId: toObjectId(CompanyId),
    }).populate("SalaryHeads.SalaryHeadId");

    if (!salarySettings) {
      return res
        .status(404)
        .json({ success: false, message: "Salary settings not found" });
    }

    // Load tax slabs applicable to this month (if any)
    const monthDate = new Date(`${normalizedMonth}-01`);
    const slabs = await TaxSlab.find({
      CompanyId: toObjectId(CompanyId),
      effectiveFrom: { $lte: monthDate },
    }).sort({ minIncome: 1 });

    // Compute slip data
    // Single mode: let computeSlipData fetch holidays/attendance internally or we can pre-fetch
    // For single, it's fine to let it fetch or fetch here. Let's fetch here for consistency if easy, 
    // but legacy fallback in helper is fine for single case optimization later if needed.
    // For now, computeSlipData has fallback, so we rely on that for single case to minimize change diff.
    const slipData = await computeSlipData({
      settings: salarySettings,
      CompanyId: toObjectId(CompanyId),
      EmployeeID: toObjectId(EmployeeID),
      Month: normalizedMonth,
      taxSlabsForMonth: slabs,
    });

    // Create slip
    const created = await SalarySlip.create(slipData);

    // Update Expense: use aggregation to compute total gross for month (avoid loading all docs)
    const agg = await SalarySlip.aggregate([
      { $match: { CompanyId: toObjectId(CompanyId), Month: normalizedMonth } },
      { $group: { _id: null, totalGross: { $sum: "$grossSalary" } } },
    ]);

    const totalExpense = round2((agg[0] && agg[0].totalGross) || 0);
    const expenseKey = `SALARY_${String(CompanyId)}_${normalizedMonth}`;

    // Upsert expense (single call)
    await Expense.findOneAndUpdate(
      {
        CompanyId: toObjectId(CompanyId),
        ExpenseType: "Salary",
        ExpenseTitle: expenseKey,
      },
      {
        $set: {
          Amount: totalExpense,
          ExpenseDate: new Date(),
          Description: `Salary expense for ${normalizedMonth}`,
        },
      },
      { upsert: true, new: true }
    );

    // Recent activity
    await RecentActivity.create({
      CompanyId: toObjectId(CompanyId),
      userId: toObjectId(EmployeeID),
      action: "Generated Salary",
      target: "Payroll",
    });

    return res
      .status(201)
      .json({
        success: true,
        message: "Salary calculated successfully",
        data: created,
      });
  } catch (error) {
    console.error("calculateSalary error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};

// -----------------------------
// Preview salary calculation (no database save)
// -----------------------------
const previewSalary = async (req, res) => {
  try {
    const { EmployeeID, CompanyId, Month } = req.body;
    if (!EmployeeID || !CompanyId || !Month) {
      return res
        .status(400)
        .json({
          success: false,
          message: "EmployeeID, CompanyId, and Month are required",
        });
    }

    const normalizedMonth = normalizeMonth(Month);
    if (!normalizedMonth) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Month format" });
    }

    // Load settings
    const salarySettings = await SalarySettings.findOne({
      EmployeeID: toObjectId(EmployeeID),
      CompanyId: toObjectId(CompanyId),
    }).populate("SalaryHeads.SalaryHeadId");

    if (!salarySettings) {
      return res
        .status(404)
        .json({ success: false, message: "Salary settings not found" });
    }

    // Load tax slabs applicable to this month
    const monthDate = new Date(`${normalizedMonth}-01`);
    const slabs = await TaxSlab.find({
      CompanyId: toObjectId(CompanyId),
      effectiveFrom: { $lte: monthDate },
    }).sort({ minIncome: 1 });

    // Compute slip data (does NOT save to database)
    const slipData = await computeSlipData({
      settings: salarySettings,
      CompanyId: toObjectId(CompanyId),
      EmployeeID: toObjectId(EmployeeID),
      Month: normalizedMonth,
      taxSlabsForMonth: slabs,
    });

    // Return preview data without saving
    return res.status(200).json({
      success: true,
      message: "Salary preview calculated successfully",
      data: slipData,
    });
  } catch (error) {
    console.error("previewSalary error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};


// -----------------------------
// Bulk salary generation (optimized, batch insert)
// -----------------------------
const calculateSalaryForAll = async (req, res) => {
  try {
    const { CompanyId, Month } = req.body;
    if (!CompanyId || !Month) {
      return res
        .status(400)
        .json({ success: false, message: "CompanyId and Month required" });
    }

    const normalizedMonth = normalizeMonth(Month);
    if (!normalizedMonth) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Month format" });
    }

    const companyObjId = toObjectId(CompanyId);
    const monthDate = new Date(`${normalizedMonth}-01`);

    // Load employees once
    const employees = await User.find({
      CompanyId: companyObjId,
      role: "Employee",
    }).select("_id");
    if (!employees.length) {
      return res
        .status(404)
        .json({ success: false, message: "No employees found" });
    }
    const employeeIds = employees.map((e) => e._id);

    // Load all salary settings for these employees in one query
    const allSettings = await SalarySettings.find({
      CompanyId: companyObjId,
      EmployeeID: { $in: employeeIds },
    }).populate("SalaryHeads.SalaryHeadId");

    const settingsMap = new Map();
    for (const s of allSettings) settingsMap.set(String(s.EmployeeID), s);

    // Load tax slabs applicable for company (we'll reuse same slabs for all employees for this month)
    const slabs = await TaxSlab.find({
      CompanyId: companyObjId,
      effectiveFrom: { $lte: monthDate },
    }).sort({ minIncome: 1 });


    // --- OPTIMIZATION START: BATCH FETCH HOLIDAYS & ATTENDANCE ---

    // 1. Fetch Holidays once
    const holidays = await Holiday.find({
      CompanyId: companyObjId,
      Date: { $regex: `^${normalizedMonth}` },
    });
    const holidayDates = new Set(holidays.map((h) => h.Date));

    // 2. Fetch Attendance for ALL relevant employees once
    // Optimization: Filter by both CompanyId, MonthPattern AND EmployeeIDs to use index effectively
    const allAttendance = await Attendance.find({
      CompanyId: companyObjId,
      UserId: { $in: employeeIds },
      Date: { $regex: `^${normalizedMonth}` },
    });

    // Structure: Map<EmployeeIDString, Map<DateString, Status>>
    const masterAttendanceMap = new Map();

    for (const rec of allAttendance) {
      const uKey = String(rec.UserId);
      if (!masterAttendanceMap.has(uKey)) {
        masterAttendanceMap.set(uKey, new Map());
      }
      masterAttendanceMap.get(uKey).set(rec.Date, rec.Status);
    }

    // --- OPTIMIZATION END ---


    // Find existing slips for this month to skip
    const existing = await SalarySlip.find({
      CompanyId: companyObjId,
      Month: normalizedMonth,
    }).select("EmployeeID");
    const existingSet = new Set(existing.map((e) => String(e.EmployeeID)));

    // Build slips to insert
    const slipsToInsert = [];
    let skipped = 0;
    const errors = [];
    for (const empId of employeeIds) {
      try {
        const empKey = String(empId);
        if (existingSet.has(empKey)) {
          skipped++;
          continue;
        }

        const settings = settingsMap.get(empKey);
        if (!settings) {
          skipped++;
          errors.push({
            employeeId: empId,
            reason: "Salary settings not found",
          });
          continue;
        }

        // Get this employee's attendance map, or empty map if none
        const empAttendanceMap = masterAttendanceMap.get(empKey) || new Map();

        // compute slip object with pre-fetched data
        const slipObj = await computeSlipData({
          settings,
          CompanyId: companyObjId,
          EmployeeID: empId,
          Month: normalizedMonth,
          taxSlabsForMonth: slabs,
          preFetchedHolidays: holidayDates,
          preFetchedAttendance: empAttendanceMap
        });

        slipsToInsert.push(slipObj);
      } catch (e) {
        skipped++;
        errors.push({ employeeId: empId, reason: e.message });
      }
    }

    let insertedCount = 0;
    let insertErrors = [];
    if (slipsToInsert.length) {
      try {
        // Insert in bulk (unordered so it keeps going on errors)
        const inserted = await SalarySlip.insertMany(slipsToInsert, {
          ordered: false,
        });
        insertedCount = inserted.length;
      } catch (bulkErr) {
        // insertMany throws on bulk write error; compute partial success if possible
        if (bulkErr && bulkErr.insertedDocs) {
          insertedCount = bulkErr.insertedDocs.length;
        } else if (bulkErr && bulkErr.result && bulkErr.result.nInserted) {
          insertedCount = bulkErr.result.nInserted;
        }
        // collect errors
        insertErrors = (bulkErr.writeErrors || []).map((we) => ({
          index: we.index,
          errmsg: we.errmsg,
        }));
      }
    }

    // Update salary expense aggregate for this month once
    const agg = await SalarySlip.aggregate([
      { $match: { CompanyId: companyObjId, Month: normalizedMonth } },
      { $group: { _id: null, totalGross: { $sum: "$grossSalary" } } },
    ]);
    const totalExpense = round2((agg[0] && agg[0].totalGross) || 0);
    const expenseKey = `SALARY_${String(CompanyId)}_${normalizedMonth}`;
    await Expense.findOneAndUpdate(
      {
        CompanyId: companyObjId,
        ExpenseType: "Salary",
        ExpenseTitle: expenseKey,
      },
      {
        $set: {
          Amount: totalExpense,
          ExpenseDate: new Date(),
          Description: `Salary expense for ${normalizedMonth}`,
        },
      },
      { upsert: true, new: true }
    );

    // Recent activity for bulk
    await RecentActivity.create({
      CompanyId: companyObjId,
      ActivityType: "BulkSalaryGeneration",
    });

    const processed = insertedCount;
    const totalSkipped = skipped;
    const totalErrors = [...errors, ...insertErrors];

    return res.status(201).json({
      success: true,
      message: "Bulk generation completed",
      processed,
      skipped: totalSkipped,
      errors: totalErrors.length ? totalErrors : undefined,
    });
  } catch (error) {
    console.error("calculateSalaryForAll error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal error",
        error: error.message,
      });
  }
};

// -----------------------------
// Other endpoints (kept, slightly hardened for ObjectId casting)
// -----------------------------
const getTotalSalaryDistribution = async (req, res) => {
  try {
    const { CompanyId, Month } = req.body;
    if (!CompanyId || !Month) {
      return res
        .status(400)
        .json({ success: false, message: "CompanyId and Month required" });
    }
    const companyObj = toObjectId(CompanyId);

    const result = await SalarySlip.aggregate([
      { $match: { CompanyId: companyObj, Month } },
      {
        $group: {
          _id: null,
          totalGrossSalary: { $sum: "$grossSalary" },
          totalDeductions: { $sum: "$totalDeductions" },
          totalTaxes: { $sum: "$TaxAmount" },
        },
      },
    ]);

    if (!result.length)
      return res.status(404).json({ success: false, message: "No data found" });
    res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error("getTotalSalaryDistribution error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDepartmentWiseSalaryDistribution = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;
    if (!CompanyId)
      return res
        .status(400)
        .json({ success: false, message: "CompanyId required" });
    const companyObj = toObjectId(CompanyId);

    const matchStage = {
      "employee.CompanyId": companyObj,
      ...(Month ? { Month } : {}),
    };

    const result = await SalarySlip.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      { $match: matchStage },
      {
        $lookup: {
          from: "departments",
          localField: "employee.DepartmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      // preserveNullAndEmptyArrays not needed for unwind of department if you want to exclude unassigned. If you want to include unassigned, use preserveNullAndEmptyArrays:true and handle null names.
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department.DepartmentName",
          totalGrossSalary: { $sum: "$grossSalary" },
          employeeCount: { $sum: 1 },
        },
      },
      { $sort: { totalGrossSalary: -1 } },
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("getDepartmentWiseSalaryDistribution error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPayrollTrend = async (req, res) => {
  try {
    const { CompanyId } = req.query;
    if (!CompanyId)
      return res
        .status(400)
        .json({ success: false, message: "CompanyId required" });
    const companyObj = toObjectId(CompanyId);

    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    const trend = [];
    for (const month of months) {
      const result = await SalarySlip.aggregate([
        { $match: { CompanyId: companyObj, Month: month } },
        {
          $group: {
            _id: null,
            totalGrossSalary: { $sum: "$grossSalary" },
            totalTax: { $sum: "$TaxAmount" },
          },
        },
      ]);
      trend.push({
        Month: month,
        totalGrossSalary: result.length ? result[0].totalGrossSalary : 0,
        totalTax: result.length ? result[0].totalTax : 0,
      });
    }

    res.status(200).json({ success: true, trend });
  } catch (error) {
    console.error("getPayrollTrend error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getHighestPaidDepartment = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;
    if (!CompanyId)
      return res
        .status(400)
        .json({ success: false, message: "CompanyId required" });
    const companyObj = toObjectId(CompanyId);

    const matchStage = {
      "employee.CompanyId": companyObj,
      ...(Month ? { Month } : {}),
    };

    const result = await SalarySlip.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      { $match: matchStage },
      {
        $lookup: {
          from: "departments",
          localField: "employee.DepartmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department.DepartmentName",
          totalSalary: { $sum: "$grossSalary" },
        },
      },
      { $sort: { totalSalary: -1 } },
      { $limit: 1 },
    ]);

    res.status(200).json({ success: true, data: result[0] || null });
  } catch (error) {
    console.error("getHighestPaidDepartment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateSalarySlipPDF = async (req, res) => {
  try {
    const { EmployeeID, Month } = req.body;
    if (!EmployeeID || !Month) {
      return res.status(400).json({
        success: false,
        message: "EmployeeID and Month required",
      });
    }

    // ============================================================
    // 🔐 EMPLOYEE PERMISSION CHECK (No changes)
    // ============================================================

    if (req.user && req.user.role === "Employee") {
      if (String(req.user._id) !== String(EmployeeID)) {
        return res.status(403).json({
          success: false,
          message: "You can only download your own salary slip",
        });
      }

      const request = await SalarySlipRequest.findOne({
        EmployeeID: toObjectId(EmployeeID),
        Month: Month,
      });

      if (!request) {
        return res.status(403).json({
          success: false,
          message: "Please request approval from HR before downloading",
          needsRequest: true,
        });
      }

      if (request.status === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your download request is pending HR approval",
          status: "pending",
          requestedAt: request.requestedAt,
        });
      }

      if (request.status === "rejected") {
        return res.status(403).json({
          success: false,
          message: "Your download request was rejected",
          status: "rejected",
          rejectionReason: request.rejectionReason,
        });
      }

      request.downloadedAt = new Date();
      await request.save();
    }

    // ============================================================
    // 📌 FETCH SALARY SLIP
    // ============================================================

    const slip = await SalarySlip.findOne({
      EmployeeID: toObjectId(EmployeeID),
      Month: Month,
    }).populate({
      path: "EmployeeID",
      populate: [
        { path: "DesignationId", select: "DesignationName" },
        { path: "DepartmentId", select: "DepartmentName" }
      ]
    });

    if (!slip) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found",
      });
    }

    const emp = slip.EmployeeID || {};
    const empName = emp.Name || emp.EmployeeName || "Unknown Employee";
    const empDesignation = emp.DesignationId?.DesignationName || "N/A";
    const empDepartment = emp.DepartmentId?.DepartmentName || "N/A";
    const bankDetails = emp.BankDetails || {};

    // Format month as "Jan 2026"
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [yearStr, monthNum] = Month.split("-");
    const formattedMonth = `${monthNames[parseInt(monthNum) - 1]} ${yearStr}`;

    // ============================================================
    // 📄 PREPARE HTML DATA
    // ============================================================

    // Read letterhead image
    const letterheadPath = path.join(process.cwd(), "logo", "custom_letterhead.png");
    let letterheadBase64 = null;
    if (fs.existsSync(letterheadPath)) {
      const imageBuffer = fs.readFileSync(letterheadPath);
      letterheadBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }

    // Read footer image
    const footerPath = path.join(process.cwd(), "..", "Client", "src", "assets", "letterhead-footer.png");
    let footerBase64 = null;
    if (fs.existsSync(footerPath)) {
      const footerBuffer = fs.readFileSync(footerPath);
      footerBase64 = `data:image/png;base64,${footerBuffer.toString('base64')}`;
    }

    const slipData = {
      letterhead: letterheadBase64,
      company: {
        name: "Digitos It Solutions Pvt Ltd",
        address: "Hudco Colony, Chhatrapati Sambhajinagar, Maharashtra",
        email: "info@digitositsolutions.com",
        phone: "+91 98765 43210"
      },
      letterheadFooter: footerBase64,
      employee: {
        name: empName,
        id: emp.EmployeeCode || "N/A",
        designation: empDesignation,
        department: empDepartment,
        bankName: bankDetails.BankName,
        accountNumber: bankDetails.AccountNumber,
        ifsc: bankDetails.IFSCCode || "N/A",
        branch: bankDetails.BranchName || "N/A"
      },
      month: formattedMonth,
      earnings: slip.Earnings || [],
      deductions: slip.Deductions || [],
      totals: {
        totalEarnings: slip.totalEarnings,
        totalDeductions: slip.totalDeductions
      },
      netSalary: slip.netSalary,
      amountInWords: convertNumberToWords(Math.round(slip.netSalary))
    };

    const htmlContent = salarySlipHtml(slipData);

    // ============================================================
    // 🖨️ PUPPETEER PDF GENERATION
    // ============================================================

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Create PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: 'none'
    });

    await browser.close();

    // Send response
    res.writeHead(200, {
      "Content-Length": pdfBuffer.length,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=SalarySlip-${Month}.pdf`,
    });
    res.end(pdfBuffer);

    // Save activity
    await RecentActivity.create({
      CompanyId: slip.CompanyId,
      UserId: toObjectId(EmployeeID), // Changed from EmployeeId to match Schema usually (UserId)
      ActivityType: "SalaryGeneration", // Or specific action logic
      ActivityDescription: `Downloaded salary slip for ${Month}`
    });

  } catch (error) {
    console.error("generateSalarySlipPDF error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAverageSalary = async (req, res) => {
  try {
    const { CompanyId } = req.body;
    if (!CompanyId)
      return res
        .status(400)
        .json({ success: false, message: "CompanyId required" });
    const companyObj = toObjectId(CompanyId);

    const result = await SalarySlip.aggregate([
      { $match: { CompanyId: companyObj } },
      {
        $group: {
          _id: null,
          avgSalary: { $avg: "$netSalary" },
          total: { $sum: 1 },
        },
      },
    ]);

    if (!result.length)
      return res.status(404).json({ success: false, message: "No data found" });
    res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error("getAverageSalary error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPayrollByBranch = async (req, res) => {
  try {
    const { CompanyId, month, year } = req.query;

    if (!CompanyId || !mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid CompanyId is required" });
    }

    const companyId = new mongoose.Types.ObjectId(CompanyId);

    // Determine the target month and year
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // 1-12
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Validate month
    if (targetMonth < 1 || targetMonth > 12) {
      return res
        .status(400)
        .json({ success: false, message: "Month must be between 1 and 12" });
    }

    // Create date range for the target month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const payrollData = await SalarySlip.aggregate([
      {
        $match: {
          CompanyId: companyId,
          // Filter by date range - adjust field name based on your schema
          // Common field names: createdAt, paymentDate, salaryDate, etc.
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },

      // Join with User to get BranchId
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // Group by BranchId
      {
        $group: {
          _id: "$employee.BranchId",
          totalPayroll: { $sum: "$netSalary" },
          employeeCount: { $sum: 1 },
        },
      },

      // Join with Branch to get Branch Name
      {
        $lookup: {
          from: "branches",
          localField: "_id",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Format response
      {
        $project: {
          _id: 0,
          branchId: "$_id",
          branchName: "$branch.BranchName",
          totalPayroll: 1,
          employeeCount: 1,
        },
      },
      { $sort: { totalPayroll: -1 } },
    ]);

    res.status(200).json({
      success: true,
      period: {
        month: targetMonth,
        year: targetYear,
        monthName: new Date(targetYear, targetMonth - 1).toLocaleString(
          "default",
          { month: "long" }
        ),
      },
      data: payrollData,
    });
  } catch (error) {
    console.error("Error fetching payroll by branch:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const requestSalarySlip = async (req, res) => {
  try {
    const { EmployeeID, Month, CompanyId } = req.body;
    if (!EmployeeID || !Month || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "EmployeeID, Month, and CompanyId are required",
      });
    }
    const slip = await SalarySlip.findOne({
      EmployeeID: toObjectId(EmployeeID),
      Month: Month,
    });
    if (!slip) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found for this month",
      });
    }
    const existingRequest = await SalarySlipRequest.findOne({
      EmployeeID: toObjectId(EmployeeID),
      Month: Month,
    });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `Request already ${existingRequest.status}`,
        status: existingRequest.status,
      });
    }
    const newRequest = await SalarySlipRequest.create({
      EmployeeID: toObjectId(EmployeeID),
      CompanyId: toObjectId(CompanyId),
      Month: Month,
      status: "pending",
      requestedAt: new Date(),
    });
    res.status(201).json({
      success: true,
      message: "Slip request sent to HR successfully",
      data: newRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getSalarySlipRequests = async (req, res) => {
  try {
    const { CompanyId, status, EmployeeID, Month } = req.query;
    const userRole = req.user.role; // From verifyToken middleware
    const userId = req.user.id;     // From verifyToken middleware

    if (!CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CompanyId is required"
      });
    }

    let query = { CompanyId };

    // If Employee → only fetch their own requests
    if (userRole === "Employee") {
      query.EmployeeID = userId;
    }

    // If HR/Admin filters by EmployeeID
    if (EmployeeID) {
      query.EmployeeID = EmployeeID;
    }

    if (status) query.status = status;
    if (Month) query.Month = Month;

    const requests = await SalarySlipRequest.find(query)
      .populate("EmployeeID", "Name Email")
      .populate("approvedBy", "Name Email");

    return res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const updateSalarySlipRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: "requestId and status are required",
      });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'",
      });
    }
    const request = await SalarySlipRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        [status === 'approved' ? 'approvedAt' : 'rejectedAt']: new Date()
      },
      { new: true }
    ).populate('EmployeeID', 'Name Email');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// -----------------------------
// Export monthly salary as CSV
// -----------------------------
const exportMonthlySalaryCSV = async (req, res) => {
  try {
    const { CompanyId, Month } = req.body;
    if (!CompanyId || !Month) {
      return res.status(400).json({
        success: false,
        message: "CompanyId and Month are required"
      });
    }

    const normalizedMonth = normalizeMonth(Month);
    if (!normalizedMonth) {
      return res.status(400).json({
        success: false,
        message: "Invalid Month format"
      });
    }

    // Fetch all salary slips for the month
    const salarySlips = await SalarySlip.find({
      CompanyId: toObjectId(CompanyId),
      Month: normalizedMonth
    }).populate({
      path: "EmployeeID",
      select: "Name Email DepartmentId DesignationId BankDetails",
      populate: [
        { path: "DepartmentId", select: "DepartmentName" },
        { path: "DesignationId", select: "DesignationName" }
      ]
    });

    if (!salarySlips || salarySlips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No salary slips found for this month"
      });
    }

    // Build CSV content
    const csvHeaders = "Employee Name,Email,Department,Designation,Bank Name,Account Holder,Account Number,IFSC Code,Bank Branch,Gross Salary,Total Deductions,Tax Amount,Net Payable\n";

    const csvRows = salarySlips.map(slip => {
      const emp = slip.EmployeeID;
      const bank = emp?.BankDetails || {};
      return [
        emp?.Name || "N/A",
        emp?.Email || "N/A",
        emp?.DepartmentId?.DepartmentName || "N/A",
        emp?.DesignationId?.DesignationName || "N/A",
        bank.BankName || "N/A",
        bank.AccountHolderName || "N/A",
        bank.AccountNumber || "N/A",
        bank.IFSCCode || "N/A",
        bank.BranchName || "N/A",
        slip.grossSalary || 0,
        slip.totalDeductions || 0,
        slip.TaxAmount || 0,
        slip.netSalary || 0
      ].join(",");
    }).join("\n");

    const csvContent = csvHeaders + csvRows;

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="salary_report_${normalizedMonth}.csv"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("exportMonthlySalaryCSV error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export {
  calculateSalary,
  previewSalary,
  getTotalSalaryDistribution,
  calculateSalaryForAll,
  getDepartmentWiseSalaryDistribution,
  getPayrollTrend,
  getHighestPaidDepartment,
  generateSalarySlipPDF,
  getAverageSalary,
  getPayrollByBranch,
  requestSalarySlip,
  getSalarySlipRequests,
  updateSalarySlipRequest,
  exportMonthlySalaryCSV
};
