import { Expense } from "../models/ExpenseSchema.js";
import { Revenue } from "../models/RevenueSchema.js";
import mongoose from "mongoose";

const getRevenueWithProfitByOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Valid OrderId is required" });
    }

    // Get revenue for the order
    const revenue = await Revenue.find({ OrderId: orderId })
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle OrderStatus TotalAmount")
      .populate("AddedBy", "Name Email");

    if (!revenue || revenue.length === 0) {
      return res
        .status(404)
        .json({ message: "No revenue found for this order" });
    }

    // Calculate total revenue amount
    const totalRevenue = revenue.reduce((acc, r) => acc + r.Amount, 0);

    // Get total expense for the same order
    const expenses = await Expense.find({ OrderId: orderId });
    const totalExpense = expenses.reduce((acc, e) => acc + e.Amount, 0);

    // Calculate profit
    const profit = totalRevenue - totalExpense;

    res.status(200).json({
      revenue,
      totalRevenue,
      totalExpense,
      profit,
    });
  } catch (error) {
    console.error("Error in getRevenueWithProfitByOrder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Total Profit --------------------
const getTotalProfitfromTotalOrder = async (req, res) => {
  try {
    const { CompanyId } = req.body;

    const match = (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId))
      ? { CompanyId: new mongoose.Types.ObjectId(CompanyId) }
      : {};

    const revenueAgg = await Revenue.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: "$Amount" } } }
    ]);

    const expenseAgg = await Expense.aggregate([
      { $match: { ...match, OrderId: { $ne: null } } },
      { $group: { _id: null, totalExpense: { $sum: "$Amount" } } }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalExpense = expenseAgg[0]?.totalExpense || 0;

    res.status(200).json({
      totalRevenue,
      totalExpense,
      totalProfit: totalRevenue - totalExpense
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
const getTotalProfit = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId) {
      return res.status(400).json({ message: "CompanyId is required" });
    }

    const companyObjectId = new mongoose.Types.ObjectId(CompanyId);

    const revenueAgg = await Revenue.aggregate([
      { $match: { CompanyId: companyObjectId } },
      { $group: { _id: null, totalRevenue: { $sum: "$Amount" } } }
    ]);

    const expenseAgg = await Expense.aggregate([
      { $match: { CompanyId: companyObjectId } },
      { $group: { _id: null, totalExpense: { $sum: "$Amount" } } }
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalExpense = expenseAgg[0]?.totalExpense || 0;

    res.status(200).json({
      totalRevenue,
      totalExpense,
      totalProfit: totalRevenue - totalExpense
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export {
  getRevenueWithProfitByOrder,
  getTotalProfit,
  getTotalProfitfromTotalOrder,
};
