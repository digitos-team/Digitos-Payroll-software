import mongoose from "mongoose";
import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import { Revenue } from "../models/RevenueSchema.js";
import { SalarySlip } from "../models/SalaryCalculateSchema.js";

const getProfitVsExpenseTrend = async (req, res) => {
  try {
    const { CompanyId } = req.query;
    if (!CompanyId || !mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid CompanyId is required" });
    }
    const companyId = new mongoose.Types.ObjectId(CompanyId);

    // Profit per month
    const profitData = await Revenue.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$RevenueDate" } },
          Amount: 1,
        },
      },
      { $group: { _id: "$Month", totalProfit: { $sum: "$Amount" } } },
      { $sort: { _id: 1 } },
    ]);

    // Expense per month
    const expenseData = await Expense.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$ExpenseDate" } },
          Amount: 1,
        },
      },
      { $group: { _id: "$Month", totalExpense: { $sum: "$Amount" } } },
      { $sort: { _id: 1 } },
    ]);

    // Combine
    const monthsSet = new Set([
      ...profitData.map((p) => p._id),
      ...expenseData.map((e) => e._id),
    ]);
    const trend = Array.from(monthsSet)
      .sort()
      .map((month) => ({
        Month: month,
        profit: profitData.find((p) => p._id === month)?.totalProfit || 0,
        expense: expenseData.find((e) => e._id === month)?.totalExpense || 0,
      }));

    res.status(200).json({ success: true, trend });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getProfitVsPayrollTrend = async (req, res) => {
  try {
    const { CompanyId } = req.query;
    if (!CompanyId || !mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid CompanyId is required" });
    }
    const companyId = new mongoose.Types.ObjectId(CompanyId);

    // Profit
    const profitData = await Revenue.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$RevenueDate" } },
          Amount: 1,
        },
      },
      { $group: { _id: "$Month", totalProfit: { $sum: "$Amount" } } },
      { $sort: { _id: 1 } },
    ]);

    // Payroll
    const payrollData = await SalarySlip.aggregate([
      { $match: { CompanyId: companyId } },
      { $group: { _id: "$Month", totalPayroll: { $sum: "$netSalary" } } },
      { $sort: { _id: 1 } },
    ]);

    // Combine
    const monthsSet = new Set([
      ...profitData.map((p) => p._id),
      ...payrollData.map((p) => p._id),
    ]);
    const trend = Array.from(monthsSet)
      .sort()
      .map((month) => ({
        Month: month,
        profit: profitData.find((p) => p._id === month)?.totalProfit || 0,
        payroll: payrollData.find((p) => p._id === month)?.totalPayroll || 0,
      }));

    res.status(200).json({ success: true, trend });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getOrderVsExpenseTrend = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId || !mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid CompanyId is required" });
    }

    const companyId = new mongoose.Types.ObjectId(CompanyId);

    // ---------- Orders per month ----------
    const orderData = await Order.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          Amount: 1,
        },
      },
      {
        $group: {
          _id: "$Month",
          totalOrderAmount: { $sum: "$Amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ---------- Expenses per month ----------
    const expenseData = await Expense.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          Amount: 1,
        },
      },
      {
        $group: {
          _id: "$Month",
          totalExpense: { $sum: "$Amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ---------- Combine both ----------
    const allMonths = new Set([
      ...orderData.map((o) => o._id),
      ...expenseData.map((e) => e._id),
    ]);

    const trend = Array.from(allMonths)
      .sort()
      .map((month) => ({
        Month: month,
        orders: orderData.find((o) => o._id === month)?.totalOrderAmount || 0,
        expense: expenseData.find((e) => e._id === month)?.totalExpense || 0,
      }));

    res.status(200).json({ success: true, trend });
  } catch (error) {
    console.error("Error in getOrderVsExpenseTrend:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getRevenueVsExpenseTrend = async (req, res) => {
  try {
    const { CompanyId } = req.query;
    if (!CompanyId || !mongoose.Types.ObjectId.isValid(CompanyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid CompanyId is required" });
    }
    const companyId = new mongoose.Types.ObjectId(CompanyId);

    // ---------- Revenue per month ----------
    const revenueData = await Revenue.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$RevenueDate" } },
          Amount: 1,
        },
      },
      { $group: { _id: "$Month", totalRevenue: { $sum: "$Amount" } } },
      { $sort: { _id: 1 } },
    ]);

    // ---------- Expense per month ----------
    const expenseData = await Expense.aggregate([
      { $match: { CompanyId: companyId } },
      {
        $project: {
          Month: { $dateToString: { format: "%Y-%m", date: "$ExpenseDate" } },
          Amount: 1,
        },
      },
      { $group: { _id: "$Month", totalExpense: { $sum: "$Amount" } } },
      { $sort: { _id: 1 } },
    ]);

    // ---------- Combine both ----------
    const allMonths = new Set([
      ...revenueData.map((r) => r._id),
      ...expenseData.map((e) => e._id),
    ]);

    const trend = Array.from(allMonths)
      .sort()
      .map((month) => {
        const revenue =
          revenueData.find((r) => r._id === month)?.totalRevenue || 0;
        const expense =
          expenseData.find((e) => e._id === month)?.totalExpense || 0;
        return {
          Month: month,
          revenue,
          expense,
          profit: revenue - expense, // Net profit
        };
      });

    res.status(200).json({ success: true, trend });
  } catch (error) {
    console.error("Error in getRevenueVsExpenseTrend:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  getProfitVsExpenseTrend,
  getProfitVsPayrollTrend,
  getOrderVsExpenseTrend,
  getRevenueVsExpenseTrend,
};
