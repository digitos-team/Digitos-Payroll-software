// financeController.js
import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import { Purchase } from "../models/PurchaseSchema.js";
import { exportToCSV } from "../utils/ExporttoCsv.js";
import fs from "fs";
import mongoose from "mongoose";

import path from "path";

import { SalarySlip } from "../models/SalaryCalculateSchema.js";
import { User } from "../models/UserSchema.js";

import { fileURLToPath } from "url";
import { createObjectCsvWriter } from "csv-writer";

// const exportRevenueCSV = async (req, res) => {
//   const orders = await Order.find().populate("CompanyId");
//   if (!orders.length)
//     return res.status(404).json({ message: "No revenue data found" });

//   const filePath = exportToCSV(orders, "revenue");
//   res.download(filePath, () => fs.unlinkSync(filePath));
// // };
// const exportPurchasesCSV = async (req, res) => {
//   const purchases = await Purchase.find().populate("CompanyId");
//   if (!purchases.length)
//     return res.status(404).json({ message: "No purchase data found" });

//   const filePath = exportToCSV(purchases, "purchases");
//   res.download(filePath, () => fs.unlinkSync(filePath));
// };
// const exportExpensesCSV = async (req, res) => {
//   const expenses = await Expense.find().populate("CompanyId");
//   if (!expenses.length)
//     return res.status(404).json({ message: "No expense data found" });

//   const filePath = exportToCSV(expenses, "expenses");
//   res.download(filePath, () => fs.unlinkSync(filePath));
// };
// const exportProfitCSV = async (req, res) => {
//   const totalRevenue = await Order.aggregate([
//     { $group: { _id: null, total: { $sum: "$TotalAmount" } } },
//   ]);
//   const totalExpense = await Expense.aggregate([
//     { $group: { _id: null, total: { $sum: "$Amount" } } },
//   ]);

//   const profit = (totalRevenue[0]?.total || 0) - (totalExpense[0]?.total || 0);
//   const summary = [
//     { Metric: "Total Revenue", Amount: totalRevenue[0]?.total || 0 },
//     { Metric: "Total Expense", Amount: totalExpense[0]?.total || 0 },
//     { Metric: "Total Profit", Amount: profit },
//   ];

//   const filePath = exportToCSV(summary, "profit_summary");
//   res.download(filePath, () => fs.unlinkSync(filePath));
// };

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// export const exportMonthlyPayrollCSV = async (req, res) => {
//   try {
//     const { CompanyId, Month } = req.query;
//     if (!CompanyId || !Month)
//       return res
//         .status(400)
//         .json({ success: false, message: "CompanyId and Month required" });

//     const companyId = new mongoose.Types.ObjectId(CompanyId);

//     const slips = await SalarySlip.aggregate([
//       { $match: { CompanyId: companyId, Month } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "EmployeeID",
//           foreignField: "_id",
//           as: "employee",
//         },
//       },
//       { $unwind: "$employee" },
//       {
//         $lookup: {
//           from: "branches",
//           localField: "employee.BranchId",
//           foreignField: "_id",
//           as: "branch",
//         },
//       },
//       { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
//       {
//         $project: {
//           EmployeeName: "$employee.Name",
//           BranchName: { $ifNull: ["$branch.BranchName", "Unknown Branch"] },
//           grossSalary: 1,
//           netSalary: 1,
//           totalEarnings: 1,
//           totalDeductions: 1,
//           TaxAmount: 1,
//         },
//       },
//     ]);

//     if (slips.length === 0)
//       return res
//         .status(404)
//         .json({ success: false, message: "No salary slips found" });

//     const exportDir = path.join(process.cwd(), "exports");
//     if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

//     const csvPath = path.join(exportDir, `Payroll_${Month}.csv`);
//     const csvWriter = createObjectCsvWriter({
//       path: csvPath,
//       header: [
//         { id: "EmployeeName", title: "Employee Name" },
//         { id: "BranchName", title: "Branch" },
//         { id: "grossSalary", title: "Gross Salary" },
//         { id: "netSalary", title: "Net Salary" },
//         { id: "totalEarnings", title: "Total Earnings" },
//         { id: "totalDeductions", title: "Total Deductions" },
//         { id: "TaxAmount", title: "Tax Amount" },
//       ],
//     });

//     await csvWriter.writeRecords(slips);

//     res.download(csvPath);
//   } catch (error) {
//     console.error("Error exporting payroll CSV:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

const exportUsersCSV = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: "$company" },

      {
        $lookup: {
          from: "departments",
          localField: "DepartmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "designations",
          localField: "DesignationId",
          foreignField: "_id",
          as: "designation",
        },
      },
      { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "branches",
          localField: "BranchId",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdUser",
        },
      },
      { $unwind: { path: "$createdUser", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "updatedBy",
          foreignField: "_id",
          as: "updatedUser",
        },
      },
      { $unwind: { path: "$updatedUser", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          Name: 1,
          Email: 1,
          Phone: 1,
          role: 1,
          EmployeeCode: 1,
          JoiningDate: 1,

          CompanyName: "$company.CompanyName",
          DepartmentName: "$department.DepartmentName",
          DesignationName: "$designation.DesignationName",
          OfficeBranchName: "$branch.BranchName",

          // Bank Details
          BankName: "$BankDetails.BankName",
          AccountHolderName: "$BankDetails.AccountHolderName",
          AccountNumber: "$BankDetails.AccountNumber",
          IFSCCode: "$BankDetails.IFSCCode",
          BankBranchName: "$BankDetails.BranchName",

          // Omitting createdAt/updatedAt and created/updated by fields from user export
          // Fields removed: createdAt, updatedAt, CreatedByName, UpdatedByName
        },
      },
    ]);

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const csvPath = path.join(exportDir, "AllUsers.csv");

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: "Name", title: "Name" },
        { id: "Email", title: "Email" },
        { id: "Phone", title: "Phone" },
        { id: "role", title: "Role" },
        { id: "EmployeeCode", title: "Employee Code" },
        // { id: "JoiningDate", title: "Joining Date" },

        // { id: "CompanyName", title: "Company Name" },
        { id: "DepartmentName", title: "Department" },
        { id: "DesignationName", title: "Designation" },
        { id: "OfficeBranchName", title: "Office Branch" },

        { id: "BankName", title: "Bank Name" },
        { id: "AccountHolderName", title: "Account Holder" },
        { id: "AccountNumber", title: "Account Number" },
        { id: "IFSCCode", title: "IFSC Code" },
        { id: "BankBranchName", title: "Bank Branch" },
      ],
    });

    await csvWriter.writeRecords(users);

    return res.download(csvPath);
  } catch (err) {
    console.error("CSV Export Error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
export {
  // exportRevenueCSV,
  // exportPurchasesCSV,
  // exportExpensesCSV,
  // exportProfitCSV,
  exportUsersCSV,
};
