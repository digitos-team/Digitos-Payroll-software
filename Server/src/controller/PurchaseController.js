import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import mongoose from "mongoose";

// -------------------- Get All Purchases (Orders with Related Expenses) --------------------
const getPurchases = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    // ✅ FIXED: Build filter for paid and partially paid orders
    const orderFilter = {
      PaymentStatus: { $in: ["Paid", "Partially Paid"] },
      // OrderStatus: "Confirmed", // Remove if you want all order statuses
    };

    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      orderFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    // Get orders with their related expenses
    const ordersData = await Order.aggregate([
      { $match: orderFilter },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "relatedExpenses"
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "CreatedBy",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          totalExpenses: { $sum: "$relatedExpenses.Amount" },
          profit: { $subtract: ["$Amount", { $sum: "$relatedExpenses.Amount" }] }
        }
      },
      {
        $project: {
          _id: 1,
          orderId: "$_id",
          clientName: "$ClientName",
          serviceTitle: "$ServiceTitle",
          orderAmount: "$Amount",
          totalExpenses: 1,
          profit: 1,
          paymentStatus: "$PaymentStatus",
          orderStatus: "$OrderStatus",
          orderDate: "$createdAt",
          paidDate: "$updatedAt",
          company: {
            _id: { $arrayElemAt: ["$company._id", 0] },
            name: { $arrayElemAt: ["$company.CompanyName", 0] }
          },
          createdBy: {
            _id: { $arrayElemAt: ["$creator._id", 0] },
            name: { $arrayElemAt: ["$creator.Name", 0] },
            email: { $arrayElemAt: ["$creator.Email", 0] }
          },
          relatedExpenses: {
            $map: {
              input: "$relatedExpenses",
              as: "exp",
              in: {
                _id: "$$exp._id",
                title: "$$exp.ExpenseTitle",
                amount: "$$exp.Amount",
                date: "$$exp.ExpenseDate",
                type: "$$exp.ExpenseType",
                paymentMethod: "$$exp.PaymentMethod",
                receipt: "$$exp.Receipt"
              }
            }
          }
        }
      },
      { $sort: { orderDate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: ordersData.length,
      data: ordersData
    });
  } catch (error) {
    console.error("Error in getPurchases:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// -------------------- Get Single Order with Expenses and Profit --------------------
const getPurchasesWithOrdersExpense = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const orderData = await Order.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "relatedExpenses"
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "CreatedBy",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          totalExpenses: { $sum: "$relatedExpenses.Amount" },
          profit: { $subtract: ["$Amount", { $sum: "$relatedExpenses.Amount" }] }
        }
      },
      {
        $project: {
          _id: 1,
          orderId: "$_id",
          clientName: "$ClientName",
          serviceTitle: "$ServiceTitle",
          orderAmount: "$Amount",
          totalExpenses: 1,
          profit: 1,
          paymentStatus: "$PaymentStatus",
          orderStatus: "$OrderStatus",
          orderDate: "$createdAt",
          paidDate: "$updatedAt",
          company: {
            _id: { $arrayElemAt: ["$company._id", 0] },
            name: { $arrayElemAt: ["$company.CompanyName", 0] }
          },
          createdBy: {
            _id: { $arrayElemAt: ["$creator._id", 0] },
            name: { $arrayElemAt: ["$creator.Name", 0] },
            email: { $arrayElemAt: ["$creator.Email", 0] }
          },
          relatedExpenses: {
            $map: {
              input: "$relatedExpenses",
              as: "exp",
              in: {
                _id: "$$exp._id",
                title: "$$exp.ExpenseTitle",
                amount: "$$exp.Amount",
                date: "$$exp.ExpenseDate",
                type: "$$exp.ExpenseType",
                paymentMethod: "$$exp.PaymentMethod",
                receipt: "$$exp.Receipt",
                description: "$$exp.Description"
              }
            }
          }
        }
      }
    ]);

    if (!orderData || orderData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: orderData[0]
    });
  } catch (error) {
    console.error("Error in getOrderWithExpenses:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// -------------------- Get Monthly Summary --------------------
const getMonthlyPurchases = async (req, res) => {
  try {
    const { CompanyId, year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid year" 
      });
    }

    const matchFilter = {
      // ✅ FIXED: Use $in operator for multiple payment statuses
      PaymentStatus: { $in: ["Paid", "Partially Paid"] },
      // OrderStatus: "Confirmed", // ❌ Remove this if you want all statuses
      updatedAt: {
        $gte: new Date(`${selectedYear}-01-01`),
        $lt: new Date(`${selectedYear + 1}-01-01`),
      },
    };

    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      matchFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const monthlyData = await Order.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "expenses"
        }
      },
      {
        $addFields: {
          orderExpenses: { $sum: "$expenses.Amount" },
          orderProfit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$updatedAt" },
            year: { $year: "$updatedAt" },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$Amount" },
          totalExpenses: { $sum: "$orderExpenses" },
          totalProfit: { $sum: "$orderProfit" }
        }
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 1,
          totalOrders: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalExpenses: { $round: ["$totalExpenses", 2] },
          totalProfit: { $round: ["$totalProfit", 2] }
        }
      }
    ]);

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const formattedData = monthlyData.map((item) => ({
      month: monthNames[item._id.month - 1],
      monthNumber: item._id.month,
      year: item._id.year,
      totalOrders: item.totalOrders,
      totalRevenue: item.totalRevenue,
      totalExpenses: item.totalExpenses,
      totalProfit: item.totalProfit
    }));

    res.status(200).json({
      success: true,
      year: selectedYear,
      data: formattedData
    });
  } catch (error) {
    console.error("Error in getMonthlyPurchases:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};
// -------------------- Get Purchases for a Specific Month --------------------
const getMonthPurchases = async (req, res) => {
  try {
    const { CompanyId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 2000 ||
      yearNum > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year",
      });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const matchFilter = {
      PaymentStatus: { $in: ["Paid", "Partially Paid"] },
      updatedAt: { $gte: startDate, $lt: endDate },
    };

    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      matchFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const orders = await Order.aggregate([
      { $match: matchFilter },

      // 🔍 Attach all expenses for this order
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "OrderId",
          as: "expenses",
        },
      },

      // ➕ Add calculated fields
      {
        $addFields: {
          orderExpenses: { $sum: "$expenses.Amount" },
          orderProfit: { $subtract: ["$Amount", { $sum: "$expenses.Amount" }] },
        },
      },

      // 🏢 Lookup company
      {
        $lookup: {
          from: "companies",
          localField: "CompanyId",
          foreignField: "_id",
          as: "company",
        },
      },

      // 🎯 Final output
      {
        $project: {
          _id: 1,
          clientName: "$ClientName",
          serviceTitle: "$ServiceTitle",
          orderAmount: "$Amount",
          paymentStatus: "$PaymentStatus",
          orderStatus: "$OrderStatus",
          orderDate: "$createdAt",
          paidDate: "$updatedAt",

          totalExpenses: "$orderExpenses",
          totalProfit: "$orderProfit",

          company: {
            _id: { $arrayElemAt: ["$company._id", 0] },
            name: { $arrayElemAt: ["$company.CompanyName", 0] },
          },
        },
      },

      { $sort: { updatedAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      month: monthNum,
      year: yearNum,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error getting monthly purchases:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



export {
  getPurchases,
  getPurchasesWithOrdersExpense,
  getMonthlyPurchases,
  getMonthPurchases
};