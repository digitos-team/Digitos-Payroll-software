import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import {
  generateMonthlyRevenueReport,
  generateMonthlyExpensesReport,
  generateMonthlyOrdersReport,
  generateMonthlyPurchasesReport,
  generateComprehensiveMonthlyReport,
  generateAnnualReportPDF,
} from "../utils/MonthlyReportPdfGenerator.js";
import { Revenue } from "../models/RevenueSchema.js";
import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import { SalarySlip } from "../models/SalaryCalculateSchema.js";
import { User } from "../models/UserSchema.js";
import { RecentActivity } from "../models/RecentActivitySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORT_DIR = path.join(process.cwd(), "exports");
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

//=====================Font Format=================================

// ================== REGISTER FONTS ==================
const registerFonts = (doc) => {
  const fontPath = path.join(process.cwd(), "fonts");
  doc.registerFont("Noto", path.join(fontPath, "NotoSans-Regular.ttf"));
  doc.registerFont("Noto-Bold", path.join(fontPath, "NotoSans-Bold.ttf"));
};

// ================== LINE HELPER ==================
const drawLine = (doc, y, x1 = 50, x2 = 545) => {
  doc.strokeColor("#000").lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke();
};

// ================== FORMAT RUPEE ==================
const formatCurrency = (value) => {
  if (!value) return "₹0.00";
  return (
    "₹" +
    Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

// -------------------- Helpers --------------------
const parseNumber = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const buildMonthRange = (month, year) => {
  const monthNum = parseNumber(month);
  const yearNum = parseNumber(year);
  if (!monthNum || !yearNum) return null;

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 1);
  return { startDate, endDate, monthNum, yearNum };
};

const sendAndCleanupFile = (res, filePath, downloadName) => {
  // send file and delete after sending
  res.download(filePath, downloadName, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      if (!res.headersSent)
        res.status(500).json({ success: false, message: "Error sending file" });
    }
    // attempt cleanup
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr)
        console.warn("Could not delete temp file:", unlinkErr.message);
    });
  });
};

// -------------------- Monthly Revenue --------------------
export const exportMonthlyRevenuePDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range)
      return res.status(400).json({ message: "month and year required" });

    const filter = {
      RevenueDate: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const revenues = await Revenue.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle")
      .populate("AddedBy", "Name Email")
      .sort({ RevenueDate: -1 })
      .lean();

    const totalAmount = revenues.reduce((s, r) => s + (r.Amount || 0), 0);
    const data = {
      summary: {
        totalRevenue: totalAmount,
        count: revenues.length,
        averageRevenue: revenues.length ? totalAmount / revenues.length : 0,
      },
      revenues: revenues.map((r) => ({
        ...r,
        ClientName: r.ClientName || "N/A",
        Source: r.Source || "Client Service",
      })),
    };

    const filePath = await generateMonthlyRevenueReport(
      data,
      range.monthNum,
      range.yearNum
    );


    // [LOG ACTIVITY] - Only for CA
    if (req.user?.role === "CA" && CompanyId) {
      await RecentActivity.create({
        CompanyId: new mongoose.Types.ObjectId(CompanyId),
        userId: req.user?._id || null,
        action: `Downloaded Monthly Revenue Report (${month}/${year})`,
        target: "Reports",
        isEmailSent: false,
      });
    }

    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyRevenuePDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Monthly Expenses --------------------
export const exportMonthlyExpensesPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range)
      return res.status(400).json({ message: "month and year required" });

    const filter = {
      ExpenseDate: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const expenses = await Expense.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle")
      .sort({ ExpenseDate: -1 })
      .lean();

    const totalAmount = expenses.reduce((s, r) => s + (r.Amount || 0), 0);

    const data = {
      summary: {
        totalExpenses: totalAmount,
        count: expenses.length,
        averageExpense: expenses.length ? totalAmount / expenses.length : 0,
      },
      expenses: expenses.map((e) => ({
        ...e,
        ExpenseTitle: e.ExpenseTitle,
        ExpenseType: e.ExpenseType || "Other",
      })),
    };

    const filePath = await generateMonthlyExpensesReport(
      data,
      range.monthNum,
      range.yearNum
    );


    // [LOG ACTIVITY] - Only for CA
    if (req.user?.role === "CA" && CompanyId) {
      await RecentActivity.create({
        CompanyId: new mongoose.Types.ObjectId(CompanyId),
        userId: req.user?._id || null,
        action: `Downloaded Monthly Expenses Report (${month}/${year})`,
        target: "Reports",
        isEmailSent: false,
      });
    }

    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyExpensesPDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Monthly Orders --------------------
export const exportMonthlyOrdersPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range)
      return res.status(400).json({ message: "month and year required" });

    const filter = { createdAt: { $gte: range.startDate, $lt: range.endDate } };
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const orders = await Order.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("CreatedBy", "Name Email")
      .sort({ createdAt: -1 })
      .lean();

    const totalValue = orders.reduce((s, o) => s + (o.Amount || 0), 0);
    const data = {
      summary: {
        count: orders.length,
        totalValue,
        averageValue: orders.length ? totalValue / orders.length : 0,
      },
      orders,
    };

    const filePath = await generateMonthlyOrdersReport(
      data,
      range.monthNum,
      range.yearNum
    );


    // [LOG ACTIVITY] - Only for CA
    if (req.user?.role === "CA" && CompanyId) {
      await RecentActivity.create({
        CompanyId: new mongoose.Types.ObjectId(CompanyId),
        userId: req.user?._id || null,
        action: `Downloaded Monthly Orders Report (${month}/${year})`,
        target: "Reports",
        isEmailSent: false,
      });
    }

    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyOrdersPDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Monthly Purchases (Profit Analysis) --------------------
export const exportMonthlyPurchasesPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range)
      return res.status(400).json({ message: "month and year required" });

    const orderFilter = {
      PaymentStatus: "Paid",
      updatedAt: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId)
      orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);

    const orders = await Order.find(orderFilter).lean();
    if (!orders.length)
      return res.status(200).json({ message: "No paid orders for this month" });

    const orderIds = orders.map((o) => o._id);
    const expenses = await Expense.find({
      OrderId: { $in: orderIds },
      ExpenseDate: { $gte: range.startDate, $lt: range.endDate },
    }).lean();

    const purchases = orders.map((order) => {
      const related = expenses.filter(
        (e) => e.OrderId.toString() === order._id.toString()
      );
      const totalExpense = related.reduce((s, r) => s + (r.Amount || 0), 0);
      const profit = (order.Amount || 0) - totalExpense;
      return {
        _id: order._id,
        ClientName: order.ClientName,
        ServiceTitle: order.ServiceTitle,
        OrderAmount: order.Amount || 0,
        TotalExpense: totalExpense,
        Profit: profit,
        profitMargin: order.Amount
          ? ((profit / order.Amount) * 100).toFixed(2)
          : "0.00",
      };
    });

    const data = {
      summary: {
        count: purchases.length,
        totalRevenue: purchases.reduce((s, p) => s + p.OrderAmount, 0),
        totalExpenses: purchases.reduce((s, p) => s + p.TotalExpense, 0),
        totalProfit: purchases.reduce((s, p) => s + p.Profit, 0),
      },
      purchases,
    };

    const filePath = await generateMonthlyPurchasesReport(
      data,
      range.monthNum,
      range.yearNum
    );


    // [LOG ACTIVITY] - Only for CA
    if (req.user?.role === "CA" && CompanyId) {
      await RecentActivity.create({
        CompanyId: new mongoose.Types.ObjectId(CompanyId),
        userId: req.user?._id || null,
        action: `Downloaded Monthly Purchases Report (${month}/${year})`,
        target: "Reports",
        isEmailSent: false,
      });
    }

    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportMonthlyPurchasesPDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Comprehensive Monthly Report --------------------
export const exportComprehensiveMonthlyReportPDF = async (req, res) => {
  try {
    const { month, year, CompanyId } = req.query;
    const range = buildMonthRange(month, year);
    if (!range)
      return res.status(400).json({ message: "month and year required" });

    // Revenue
    const revenueFilter = {
      RevenueDate: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId)
      revenueFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const revenues = await Revenue.find(revenueFilter)
      .populate("CompanyId", "CompanyName")
      .lean();
    const revenueData = {
      summary: {
        totalRevenue: revenues.reduce((s, r) => s + (r.Amount || 0), 0),
        count: revenues.length,
      },
      revenues,
    };

    // Expenses
    const expenseFilter = {
      ExpenseDate: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId)
      expenseFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const allExpenses = await Expense.find(expenseFilter)
      .populate("CompanyId", "CompanyName")
      .lean();
    const expensesData = {
      summary: {
        totalExpenses: allExpenses.reduce((s, e) => s + (e.Amount || 0), 0),
        count: allExpenses.length,
      },
      expenses: allExpenses,
    };

    // Orders
    const orderFilter = {
      createdAt: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId)
      orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const orders = await Order.find(orderFilter)
      .populate("CompanyId", "CompanyName")
      .lean();
    const ordersData = {
      summary: {
        count: orders.length,
        totalValue: orders.reduce((s, o) => s + (o.Amount || 0), 0),
      },
      orders,
    };

    // Purchases/profit
    const paidOrderFilter = {
      PaymentStatus: "Paid",
      updatedAt: { $gte: range.startDate, $lt: range.endDate },
    };
    if (CompanyId)
      paidOrderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    const paidOrders = await Order.find(paidOrderFilter).lean();
    const paidOrderIds = paidOrders.map((o) => o._id);
    const purchaseExpenses = await Expense.find({
      OrderId: { $in: paidOrderIds },
      ExpenseDate: { $gte: range.startDate, $lt: range.endDate },
    }).lean();

    const purchases = paidOrders.map((order) => {
      const related = purchaseExpenses.filter(
        (e) => e.OrderId.toString() === order._id.toString()
      );
      const totalExpense = related.reduce((s, r) => s + (r.Amount || 0), 0);
      const profit = (order.Amount || 0) - totalExpense;
      return {
        _id: order._id,
        ClientName: order.ClientName,
        ServiceTitle: order.ServiceTitle,
        OrderAmount: order.Amount || 0,
        TotalExpense: totalExpense,
        Profit: profit,
        profitMargin: order.Amount
          ? ((profit / order.Amount) * 100).toFixed(2)
          : "0.00",
      };
    });

    const purchasesData = {
      summary: {
        count: purchases.length,
        totalRevenue: purchases.reduce((s, p) => s + p.OrderAmount, 0),
        totalExpenses: purchases.reduce((s, p) => s + p.TotalExpense, 0),
        totalProfit: purchases.reduce((s, p) => s + p.Profit, 0),
      },
      purchases,
    };

    const filePath = await generateComprehensiveMonthlyReport(
      revenueData,
      expensesData,
      ordersData,
      purchasesData,
      range.monthNum,
      range.yearNum
    );


    // [LOG ACTIVITY] - Only for CA
    if (req.user?.role === "CA" && CompanyId) {
      await RecentActivity.create({
        CompanyId: new mongoose.Types.ObjectId(CompanyId),
        userId: req.user?._id || null,
        action: `Downloaded Comprehensive Monthly Report (${month}/${year})`,
        target: "Reports",
        isEmailSent: false,
      });
    }

    sendAndCleanupFile(res, filePath, path.basename(filePath));
  } catch (error) {
    console.error("exportComprehensiveMonthlyReportPDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Annual Report --------------------
export const exportAnnualReportPDF = async (req, res) => {
  try {
    const { year, CompanyId } = req.query;
    const yearNum = parseNumber(year);
    if (!yearNum) return res.status(400).json({ message: "year is required" });

    const yearStart = new Date(`${yearNum}-01-01`);
    const yearEnd = new Date(`${yearNum + 1}-01-01`);

    const revenueFilter = { RevenueDate: { $gte: yearStart, $lt: yearEnd } };
    const expenseFilter = { ExpenseDate: { $gte: yearStart, $lt: yearEnd } };
    const orderFilter = { createdAt: { $gte: yearStart, $lt: yearEnd } };

    if (CompanyId) {
      const companyObjectId = new mongoose.Types.ObjectId(CompanyId);
      revenueFilter.CompanyId = companyObjectId;
      expenseFilter.CompanyId = companyObjectId;
      orderFilter.CompanyId = companyObjectId;
    }

    const revenues = await Revenue.find(revenueFilter).lean();
    const expenses = await Expense.find(expenseFilter).lean();
    const orders = await Order.find(orderFilter).lean();

    const monthlyRevenue = await Revenue.aggregate([
      { $match: revenueFilter },
      {
        $group: { _id: { $month: "$RevenueDate" }, total: { $sum: "$Amount" } },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = {
      year: yearNum,
      totals: {
        revenue: revenues.reduce((s, r) => s + (r.Amount || 0), 0),
        expenses: expenses.reduce((s, e) => s + (e.Amount || 0), 0),
        profit:
          revenues.reduce((s, r) => s + (r.Amount || 0), 0) -
          expenses.reduce((s, e) => s + (e.Amount || 0), 0),
        orders: orders.length,
      },
      monthlyBreakdown: monthlyRevenue,
    };

    const filePath = await generateAnnualReportPDF(data);


    // [LOG ACTIVITY] - Only for CA
    if (req.user?.role === "CA" && CompanyId) {
      await RecentActivity.create({
        CompanyId: new mongoose.Types.ObjectId(CompanyId),
        userId: req.user?._id || null,
        action: `Downloaded Annual Report (${year})`,
        target: "Reports",
        isEmailSent: false,
      });
    }

    sendAndCleanupFile(res, filePath, `Annual_Report_${yearNum}.pdf`);
  } catch (error) {
    console.error("exportAnnualReportPDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// -------------------- Salary Report --------------------
export const generateSalaryReportPDF = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;
    if (!CompanyId)
      return res
        .status(400)
        .json({ success: false, message: "CompanyId required" });

    const query = Month
      ? { CompanyId: new mongoose.Types.ObjectId(CompanyId), Month }
      : { CompanyId: new mongoose.Types.ObjectId(CompanyId) };

    const slips = await SalarySlip.find(query).lean();
    if (!slips.length)
      return res
        .status(404)
        .json({ success: false, message: "No salary data found" });

    // Fetch employees
    const employeeIds = [
      ...new Set(slips.map((s) => s.EmployeeID?.toString()).filter(Boolean)),
    ];
    const employees = await User.find({ _id: { $in: employeeIds } })
      .select("_id Name Email EmployeeCode DepartmentId")
      .lean();

    const employeeMap = new Map(employees.map((e) => [e._id.toString(), e]));

    const validSlips = slips
      .map((slip) => {
        const emp = employeeMap.get(slip.EmployeeID?.toString());
        return emp ? { ...slip, Employee: emp } : null;
      })
      .filter(Boolean);

    if (!validSlips.length)
      return res
        .status(404)
        .json({
          success: false,
          message: "No valid employee data found for slips",
        });

    // Department Aggregation
    const deptAggregation = await SalarySlip.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $lookup: {
          from: "departments",
          localField: "employee.DepartmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$department.DepartmentName", "Unassigned"] },
          totalGrossSalary: { $sum: "$grossSalary" },
          totalNetSalary: { $sum: "$netSalary" },
          employeeCount: { $sum: 1 },
        },
      },
      {
        $project: {
          DepartmentName: "$_id",
          totalGrossSalary: 1,
          totalNetSalary: 1,
          employeeCount: 1,
          _id: 0,
        },
      },
      { $sort: { totalGrossSalary: -1 } },
    ]);

    // ===== PDF GENERATION =====
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];

    doc.on("data", (b) => buffers.push(b));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);


      // [LOG ACTIVITY] - Only for CA
      if (req.user?.role === "CA" && CompanyId) {
        await RecentActivity.create({
          CompanyId: new mongoose.Types.ObjectId(CompanyId),
          userId: req.user?._id || null,
          action: `Downloaded Salary Report (${Month || "All Months"})`,
          target: "Reports",
          isEmailSent: false,
        });
      }

      res.writeHead(200, {
        "Content-Length": pdfData.length,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=SalaryReport-${Month || "AllMonths"
          }.pdf`,
      });
      res.end(pdfData);
    });

    registerFonts(doc);

    let y = 50;

    // =================== FOOTER FUNCTION ===================
    const addFooter = () => {
      doc
        .font("Noto")
        .fontSize(10)
        .fillColor("#000")
        .text(`Page ${doc.page.number}`, 0, doc.page.height - 40, {
          align: "center",
        });
    };

    // =================== COMPANY HEADER ===================
    doc
      .font("Noto-Bold")
      .fontSize(18)
      .text("Digitos It Solutions Pvt Ltd", 50, y, { align: "right" });

    y += 25;

    doc
      .font("Noto")
      .fontSize(10)
      .text("Hudco Colony", 50, y, { align: "right" })
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 12, {
        align: "right",
      })
      .text("Phone: +91 98765 43210", 50, y + 24, { align: "right" })
      .text("Email: info@digitositsolutions.com", 50, y + 36, {
        align: "right",
      })
      .text("GSTIN: 27ABCDE1234F1Z5", 50, y + 48, { align: "right" });

    y += 90;

    // =================== TITLE ===================
    doc
      .font("Noto-Bold")
      .fontSize(20)
      .text(`Salary Report - ${Month || "All Months"}`, { align: "center" });

    y += 30;
    drawLine(doc, y);
    y += 25;

    // =================== LOGO WATERMARK ===================
    const logoPath = path.join(process.cwd(), "logo", "RGB.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.1);
      doc.image(logoPath, 150, y + 30, { width: 300 });
      doc.restore();
    }

    // =================== SUMMARY ===================
    const totalGross = validSlips.reduce(
      (s, slip) => s + (slip.grossSalary || 0),
      0
    );
    const totalNet = validSlips.reduce(
      (s, slip) => s + (slip.netSalary || 0),
      0
    );

    doc.font("Noto-Bold").fontSize(14).text("Summary", 50, y);
    y = doc.y + 10;

    doc
      .font("Noto")
      .fontSize(12)
      .text(`Total Employees  : ${validSlips.length}`)
      .text(`Total Gross Salary: ₹${totalGross.toLocaleString("en-IN")}`)
      .text(`Total Net Salary  : ₹${totalNet.toLocaleString("en-IN")}`);

    y = doc.y + 20;
    drawLine(doc, y);
    y += 30;

    // =================== TABLE HEADER ===================
    doc.font("Noto-Bold").fontSize(12);

    const col1 = 50; // Name
    const col2 = 250; // Gross
    const col3 = 350; // Net
    const col4 = 450; // Month

    doc.text("Name", col1, y);
    doc.text("Gross", col2, y);
    doc.text("Net", col3, y);
    doc.text("Month", col4, y);

    y += 20;
    drawLine(doc, y);
    y += 10;

    doc.font("Noto").fontSize(10);

    // =================== TABLE ROWS ===================
    for (const slip of validSlips) {
      const emp = slip.Employee;
      const name =
        emp?.Name ||
        emp?.EmployeeCode ||
        emp?.Email?.split("@")[0] ||
        `Employee ${emp?._id}`;

      doc.text(name.substring(0, 20), col1, y);
      doc.text(`₹${(slip.grossSalary || 0).toLocaleString("en-IN")}`, col2, y);
      doc.text(`₹${(slip.netSalary || 0).toLocaleString("en-IN")}`, col3, y);
      doc.text(slip.Month, col4, y);

      y += 22;

      // Handle page breaks
      if (y > 700) {
        addFooter();
        doc.addPage();
        y = 50;

        // Repeat table header
        doc.font("Noto-Bold").fontSize(12);
        doc.text("Name", col1, y);
        doc.text("Gross", col2, y);
        doc.text("Net", col3, y);
        doc.text("Month", col4, y);

        y += 20;
        drawLine(doc, y);
        y += 10;

        doc.font("Noto").fontSize(10);
      }
    }

    // =================== DEPARTMENT DISTRIBUTION ===================
    if (deptAggregation.length) {
      addFooter();
      doc.addPage();
      y = 50;

      doc
        .font("Noto-Bold")
        .fontSize(14)
        .text("Department-wise Salary Distribution", { underline: true });

      y = doc.y + 15;

      deptAggregation.forEach((d, idx) => {
        doc
          .font("Noto-Bold")
          .fontSize(11)
          .text(`${idx + 1}. ${d.DepartmentName}`);
        doc
          .font("Noto")
          .fontSize(10)
          .text(
            `   Gross: ₹${d.totalGrossSalary.toLocaleString(
              "en-IN"
            )} | Net: ₹${d.totalNetSalary.toLocaleString(
              "en-IN"
            )} | Employees: ${d.employeeCount}`
          );
        y = doc.y + 10;

        if (y > 700) {
          addFooter();
          doc.addPage();
          y = 50;
        }
      });
    }

    // FINAL FOOTER
    addFooter();
    doc.end();
  } catch (error) {
    console.error("generateSalaryReportPDF:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// -------------------- Monthly Payroll (Branch-wise) --------------------
export const exportMonthlyPayrollPDF = async (req, res) => {
  try {
    const { CompanyId, Month } = req.query;
    if (!CompanyId || !Month)
      return res.status(400).json({
        success: false,
        message: "CompanyId and Month are required",
      });

    // Aggregation: SalarySlip -> User -> Branch
    // This handling ensures we find the branch even if it wasn't saved on the slip directly.
    const payrollData = await SalarySlip.aggregate([
      {
        $match: {
          CompanyId: new mongoose.Types.ObjectId(CompanyId),
          Month: Month,
        },
      },
      // 1. Lookup Employee to find their BranchId (fallback)
      {
        $lookup: {
          from: "users", // Assuming your User collection is named 'users'
          localField: "EmployeeID",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      {
        $unwind: { path: "$employeeData", preserveNullAndEmptyArrays: true },
      },
      // 2. Determine the effective BranchId (Slip > User > Null)
      {
        $addFields: {
          effectiveBranchId: {
            $ifNull: ["$BranchId", "$employeeData.BranchId"]
          },
        },
      },
      // 3. Lookup Branch using the effective ID
      {
        $lookup: {
          from: "branches",
          localField: "effectiveBranchId",
          foreignField: "_id",
          as: "branchData",
        },
      },
      {
        $unwind: { path: "$branchData", preserveNullAndEmptyArrays: true },
      },
      // 4. Group by Branch Name
      {
        $group: {
          _id: {
            BranchName: { $ifNull: ["$branchData.BranchName", "Unknown Branch"] },
          },
          totalGross: { $sum: "$grossSalary" },
          totalNet: { $sum: "$netSalary" },
          employeeCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          BranchName: "$_id.BranchName",
          totalGross: 1,
          totalNet: 1,
          employeeCount: 1,
        },
      },
      { $sort: { BranchName: 1 } },
    ]);

    if (!payrollData.length)
      return res.status(404).json({
        success: false,
        message: "No payroll data found for this month",
      });

    const fileName = `Payroll_${Month}.pdf`;
    const filePath = path.join(EXPORT_DIR, fileName);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    registerFonts(doc);

    let y = 50;

    // ================== COMPANY HEADER ==================
    doc
      .font("Noto-Bold")
      .fontSize(18)
      .fillColor("#000")
      .text("Digitos It Solutions Pvt Ltd", 50, y, { align: "right" });

    y += 25;
    doc.font("Noto").fontSize(10);
    doc
      .text("Hudco Colony", 50, y, { align: "right" })
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 12, {
        align: "right",
      })
      .text("Phone: +91 98765 43210", 50, y + 24, { align: "right" })
      .text("Email: info@digitositsolutions.com", 50, y + 36, {
        align: "right",
      })
      .text("GSTIN: 27ABCDE1234F1Z5", 50, y + 48, { align: "right" });

    y += 90;

    // ================== TITLE ==================
    doc
      .font("Noto-Bold")
      .fontSize(20)
      .fillColor("#000")
      .text("Branch-wise Monthly Payroll Report", 50, y, { align: "center" });

    y += 30;
    doc
      .font("Noto")
      .fontSize(12)
      .text(`Month: ${Month}`, 50, y, { align: "center" });

    y += 25;
    drawLine(doc, y);
    y += 30;

    // ================== LOGO ==================
    const logoPath = path.join(process.cwd(), "logo", "RGB.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.1);
      doc.image(logoPath, 150, y + 40, { width: 300 });
      doc.restore();
    }

    // ================== TABLE HEADER ==================
    doc.font("Noto-Bold").fontSize(12);

    doc.text("Branch Name", 50, y, { width: 150 });
    doc.text("Employees", 220, y, { width: 100 });
    doc.text("Total Gross", 340, y, { width: 100 });
    doc.text("Total Net", 460, y, { width: 100 });

    y += 20;
    drawLine(doc, y);
    y += 10;

    // ================== TABLE ROWS ==================
    doc.font("Noto").fontSize(11);

    payrollData.forEach((row) => {
      doc.text(row.BranchName, 50, y, { width: 150 });
      doc.text(row.employeeCount.toString(), 220, y, { width: 100 });
      doc.text(formatCurrency(row.totalGross), 340, y, { width: 100 });
      doc.text(formatCurrency(row.totalNet), 460, y, { width: 100 });

      y += 22;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // ================== SUMMARY ==================
    y += 20;
    drawLine(doc, y);
    y += 20;

    const totalGrossAll = payrollData.reduce((s, d) => s + d.totalGross, 0);
    const totalNetAll = payrollData.reduce((s, d) => s + d.totalNet, 0);
    const totalEmployees = payrollData.reduce((s, d) => s + d.employeeCount, 0);

    doc.font("Noto-Bold").fontSize(14).text("Summary", 50, y);
    y += 20;

    doc.font("Noto").fontSize(12);
    doc.text(`Total Branches     : ${payrollData.length}`);
    doc.text(`Total Employees    : ${totalEmployees}`);
    doc.text(`Total Gross Salary : ${formatCurrency(totalGrossAll)}`);
    doc.text(`Total Net Salary   : ${formatCurrency(totalNetAll)}`);

    // ================== FOOTER ==================
    const pages = doc.bufferedPageRange().count;
    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);
      doc
        .font("Noto")
        .fontSize(10)
        .fillColor("#000")
        .text(`Page ${i + 1} of ${pages}`, 0, doc.page.height - 40, {
          align: "center",
        });
    }

    doc.end();

    stream.on("finish", async () => {
      // Log activity
      if (CompanyId) {
        const userId = req.user ? req.user._id : null;
        await RecentActivity.create({
          CompanyId: new mongoose.Types.ObjectId(CompanyId),
          userId: userId, // Safe fallback
          action: `Downloaded Branch-wise Payroll Report (${Month})`,
          target: "Reports",
          isEmailSent: false,
        });
      }
      sendAndCleanupFile(res, filePath, fileName);
    });
  } catch (error) {
    console.error("exportMonthlyPayrollPDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export PDF",
      error: error.message,
    });
  }
};
// -------------------- NEW: Overall Orders PDF --------------------
// Generates a PDF of orders optionally filtered by company and date-range
export const exportOverallOrdersPDF = async (req, res) => {
  try {
    const { CompanyId, startDate: start, endDate: end } = req.query;

    const filter = {};
    if (CompanyId) filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) filter.createdAt.$lt = new Date(end);
    }

    const orders = await Order.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("CreatedBy", "Name Email")
      .sort({ createdAt: -1 })
      .lean();

    if (!orders.length)
      return res
        .status(404)
        .json({ message: "No orders found for given filters" });

    const fileName = `Orders_${CompanyId || "All"}_${Date.now()}.pdf`;
    const filePath = path.join(EXPORT_DIR, fileName);

    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ------------------ REGISTER FONTS ------------------
    const fontDir = path.join(process.cwd(), "fonts");
    doc.registerFont("Noto", path.join(fontDir, "NotoSans-Regular.ttf"));
    doc.registerFont("Noto-Bold", path.join(fontDir, "NotoSans-Bold.ttf"));

    const logoPath = path.join(process.cwd(), "logo", "RGB.png");

    let y = 40;

    // ------------------ COMPANY HEADER ------------------
    doc
      .font("Noto-Bold")
      .fontSize(18)
      .text("Digitos It Solutions Pvt Ltd", 50, y, { align: "right" });

    y += 25;

    doc
      .font("Noto")
      .fontSize(10)
      .text("Hudco Colony", 50, y, { align: "right" })
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 12, {
        align: "right",
      })
      .text("Phone: +91 98765 43210", 50, y + 24, { align: "right" })
      .text("Email: info@digitositsolutions.com", 50, y + 36, {
        align: "right",
      })
      .text("GSTIN: 27ABCDE1234F1Z5", 50, y + 48, { align: "right" });

    y += 90;

    // ------------------ TITLE ------------------
    doc
      .font("Noto-Bold")
      .fontSize(20)
      .text("Orders Report", { align: "center" });

    doc.moveDown();
    doc
      .font("Noto")
      .fontSize(10)
      .text(`Generated: ${new Date().toLocaleDateString("en-IN")}`);

    if (CompanyId) doc.text(`CompanyId: ${CompanyId}`);
    if (start || end)
      doc.text(`Range: ${start || "(any)"} to ${end || "(any)"}`);

    y = doc.y + 15;

    // ------------------ WATERMARK ------------------
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.4);
      doc.image(logoPath, 150, y + 40, { width: 300 });
      doc.restore();
    }

    // ------------------ TABLE HEADER ------------------
    y += 20;

    doc
      .font("Noto-Bold")
      .fontSize(11)
      .text("#", 50, y, { width: 30 })
      .text("Order ID", 90, y, { width: 100 })
      .text("Client", 200, y, { width: 120 })
      .text("Amount (₹)", 330, y, { width: 80 })
      .text("Status", 420, y, { width: 80 })
      .text("Date", 500, y, { width: 80 });

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    doc.font("Noto").fontSize(10);

    // ------------------ TABLE ROWS ------------------
    orders.forEach((o, idx) => {
      if (y > 720) {
        doc.addPage();
        y = 40;

        // Reprint table header on new page
        doc
          .font("Noto-Bold")
          .fontSize(11)
          .text("#", 50, y, { width: 30 })
          .text("Order ID", 90, y, { width: 100 })
          .text("Client", 200, y, { width: 120 })
          .text("Amount (₹)", 330, y, { width: 80 })
          .text("Status", 420, y, { width: 80 })
          .text("Date", 500, y, { width: 80 });

        y += 20;
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        doc.font("Noto").fontSize(10);
      }

      const date = new Date(o.createdAt).toLocaleDateString("en-IN"); // FIXED: NO TIME

      doc
        .text(String(idx + 1), 50, y, { width: 30 })
        .text(String(o._id).slice(-8), 90, y, { width: 100 })
        .text(o.ClientName || o.CreatedBy?.Name || "-", 200, y, { width: 120 })
        .text(
          o.Amount != null
            ? `₹${Number(o.Amount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`
            : "-",
          330,
          y,
          { width: 80 }
        )
        .text(o.PaymentStatus || o.Status || "-", 420, y, { width: 80 })
        .text(date, 500, y, { width: 80 });

      y += 22;
    });

    // ------------------ FOOTER PAGE NUMBERS ------------------
    const totalPages = doc.bufferedPageRange().count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .font("Noto")
        .fontSize(10)
        .text(`Page ${i + 1} of ${totalPages}`, 0, doc.page.height - 40, {
          align: "center",
        });
    }

    doc.end();

    stream.on("finish", async () => {
      // [LOG ACTIVITY]
      if (CompanyId) {
        const rangeText = start && end ? `(${start} to ${end})` : "(All Time)";
        await RecentActivity.create({
          CompanyId: new mongoose.Types.ObjectId(CompanyId),
          userId: req.user?._id || null,
          action: `Downloaded Overall Orders Report ${rangeText}`,
          target: "Reports",
          isEmailSent: false,
        });
      }
      sendAndCleanupFile(res, filePath, fileName);
    });
  } catch (error) {
    console.error("exportOverallOrdersPDF:", error);
    res
      .status(500)
      .json({ message: "Error generating Orders PDF", error: error.message });
  }
};

export default {
  exportMonthlyRevenuePDF,
  exportMonthlyExpensesPDF,
  exportMonthlyOrdersPDF,
  exportMonthlyPurchasesPDF,
  exportComprehensiveMonthlyReportPDF,
  exportAnnualReportPDF,
  generateSalaryReportPDF,
  exportMonthlyPayrollPDF,
  exportOverallOrdersPDF,
};
