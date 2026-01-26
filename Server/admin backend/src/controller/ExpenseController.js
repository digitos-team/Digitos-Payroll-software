import mongoose from "mongoose";
import { Expense } from "../models/ExpenseSchema.js";

// -------------------- Add Expense --------------------
const addExpense = async (req, res) => {
  try {
    const {
      ExpenseTitle,
      Amount,
      ExpenseDate,
      CompanyId,
      AddedBy,
      OrderId,
      ExpenseType,
      PaymentMethod,
      Description,
    } = req.body;

    console.log("Incoming Expense Data:", req.body);
    console.log("Authenticated user:", req.user);
    console.log("Uploaded file:", req.file);

    // Validate required fields
    if (!ExpenseTitle || !Amount || !ExpenseDate || !CompanyId) {
      return res.status(400).json({
        message:
          "ExpenseTitle, Amount, ExpenseDate, CompanyId, and AddedBy are required",
      });
    }

    console.log("Authenticated user:", req.user);

    const Receipt = req.file ? req.file.path.replace("\\", "/") : null;
    console.log("File uploaded:", req.file);

    const expense = new Expense({
      ExpenseTitle,
      Amount,
      ExpenseDate,
      CompanyId,
      OrderId: OrderId || null, // Link to order if provided
      AddedBy,
      ExpenseType: ExpenseType || "Other",
      PaymentMethod: PaymentMethod || "Bank Transfer",
      Description,
      Receipt,
      isFixed: req.body.isFixed || false,
    });

    await expense.save();

    // ✅ REMOVED: Purchase creation logic
    // Purchases are only created when order is confirmed/paid in OrderController

    res.status(201).json({
      message: "Expense added successfully",
      expense,
      note: expense.OrderId
        ? "Expense linked to order - will appear in purchase section when order is paid"
        : "Standalone operational expense",
    });
  } catch (error) {
    console.error("Error in addExpense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get All Expenses --------------------
const getAllExpenses = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId) {
      return res.status(400).json({ message: "CompanyId is required" });
    }

    const expenses = await Expense.find({ CompanyId })
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle ClientName")
      .sort({ ExpenseDate: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error in getAllExpenses:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// -------------------- Get Expense by ID --------------------
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.body; // ✅ Changed from req.body to req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Expense ID" });
    }

    const expense = await Expense.findById(id)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle ClientName");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error in getExpenseById:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Fetch the existing expense
    const existingExpense = await Expense.findById(expenseId);
    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Block updates if the expense type is Salary
    if (existingExpense.ExpenseType === "Salary") {
      return res
        .status(403)
        .json({ message: "Salary expenses cannot be updated" });
    }

    // Prepare updated data
    const updateData = { ...req.body };
    if (req.file) {
      updateData.Receipt = req.file.path.replace("\\", "/");
    }
    // Ensure isFixed is updated if provided
    if (req.body.isFixed !== undefined) {
      updateData.isFixed = req.body.isFixed;
    }

    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete Expense --------------------
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const getTotalExpense = async (req, res) => {
  try {
    const { CompanyId } = req.body;

    if (!CompanyId) {
      return res.status(400).json({ message: "CompanyId is required" });
    }

    const pipeline = [
      {
        $match: {
          $expr: { $eq: [{ $toString: "$CompanyId" }, CompanyId] },
        },
      },

      // STEP 1: Convert Amount → string (always safe)
      {
        $addFields: {
          amountStr: { $toString: "$Amount" },
        },
      },

      // STEP 2: Remove commas and currency symbols safely
      {
        $addFields: {
          amountStr: {
            $replaceAll: {
              input: "$amountStr",
              find: ",",
              replacement: "",
            },
          },
        },
      },
      {
        $addFields: {
          amountStr: {
            $replaceAll: {
              input: "$amountStr",
              find: "₹",
              replacement: "",
            },
          },
        },
      },

      // STEP 3: Convert back to number
      {
        $addFields: {
          amountNumeric: {
            $convert: {
              input: "$amountStr",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },

      // STEP 4: Group results
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amountNumeric" },
          totalRecords: { $sum: 1 },
        },
      },
    ];

    const result = await Expense.aggregate(pipeline);

    return res.status(200).json({
      totalExpense: result[0]?.totalExpense || 0,
      totalRecords: result[0]?.totalRecords || 0,
    });
  } catch (error) {
    console.error("Error in getTotalExpense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Expenses by Order --------------------
const getExpensesByOrder = async (req, res) => {
  try {
    const { orderId } = req.body; // or req.params/query

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const expenses = await Expense.find({ OrderId: orderId })
      .populate("CompanyId", "CompanyName") // keep this
      .sort({ ExpenseDate: -1 });

    const totalExpense = expenses.reduce(
      (sum, exp) => sum + Number(exp.Amount),
      0
    );

    res.status(200).json({
      expenses,
      totalExpense,
      count: expenses.length,
    });
  } catch (error) {
    console.error("Error in getExpensesByOrder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- MONTHLY EXPENSES --------------------
const getMonthlyExpenses = async (req, res) => {
  try {
    const { CompanyId, year } = req.query;

    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    const filter = {
      ExpenseDate: {
        $gte: new Date(`${selectedYear}-01-01`),
        $lt: new Date(`${selectedYear + 1}-01-01`),
      },
    };

    // if (CompanyId) filter.CompanyId = CompanyId;
    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const monthlyExpenses = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            month: { $month: "$ExpenseDate" },
            year: { $year: "$ExpenseDate" },
          },
          totalExpense: { $sum: "$Amount" },
          count: { $sum: 1 },
          averageExpense: { $avg: "$Amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const formattedData = monthlyExpenses.map((item) => {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return {
        month: monthNames[item._id.month - 1],
        monthNumber: item._id.month,
        year: item._id.year,
        totalExpense: item.totalExpense,
        count: item.count,
        averageExpense: item.averageExpense,
      };
    });

    res.status(200).json({
      year: selectedYear,
      data: formattedData,
      grandTotal: formattedData.reduce(
        (sum, item) => sum + item.totalExpense,
        0
      ),
    });
  } catch (error) {
    console.error("Error in getMonthlyExpenses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get expenses for a specific month
const getMonthExpenses = async (req, res) => {
  try {
    const { CompanyId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const filter = {
      ExpenseDate: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    if (CompanyId) filter.CompanyId = CompanyId;

    const expenses = await Expense.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle ClientName")
      .sort({ ExpenseDate: -1 });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.Amount, 0);

    res.status(200).json({
      month: new Date(yearNum, monthNum - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      count: expenses.length,
      totalAmount,
      expenses,
    });
  } catch (error) {
    console.error("Error in getMonthExpenses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Copy Fixed Expenses --------------------
const copyFixedExpenses = async (req, res) => {
  try {
    const { CompanyId, targetMonth, targetYear } = req.body;

    if (!CompanyId || !targetMonth || !targetYear) {
      return res.status(400).json({ message: "CompanyId, targetMonth, and targetYear are required" });
    }

    const tMonth = parseInt(targetMonth);
    const tYear = parseInt(targetYear);

    // Calculate previous month
    let prevMonth = tMonth - 1;
    let prevYear = tYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = tYear - 1;
    }

    // Find fixed expenses from previous month
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 1);

    const fixedExpenses = await Expense.find({
      CompanyId,
      isFixed: true,
      ExpenseDate: { $gte: startDate, $lt: endDate },
    });

    if (fixedExpenses.length === 0) {
      return res.status(200).json({ message: "No fixed expenses found in the previous month", count: 0 });
    }

    let copiedCount = 0;
    const newExpenses = [];

    for (const expense of fixedExpenses) {
      // Create new date for the target month (preserve day if possible)
      const originalDate = new Date(expense.ExpenseDate);
      const day = originalDate.getDate();
      // Handle edge cases (e.g., Jan 31 -> Feb 28)
      const newDate = new Date(tYear, tMonth - 1, day);

      // Check if already exists in target month to avoid duplicates
      // We check for same title, same amount, same type in the target month
      const exists = await Expense.findOne({
        CompanyId,
        ExpenseTitle: expense.ExpenseTitle,
        Amount: expense.Amount,
        ExpenseType: expense.ExpenseType,
        ExpenseDate: {
          $gte: new Date(tYear, tMonth - 1, 1),
          $lt: new Date(tYear, tMonth, 1),
        }
      });

      if (!exists) {
        newExpenses.push({
          CompanyId,
          ExpenseTitle: expense.ExpenseTitle,
          Amount: expense.Amount,
          ExpenseDate: newDate,
          ExpenseType: expense.ExpenseType,
          PaymentMethod: expense.PaymentMethod,
          Description: expense.Description,
          isFixed: true, // Keep it fixed for next month too
          AddedBy: req.user?._id, // Current user
          OrderId: expense.OrderId, // Keep order link if any
        });
        copiedCount++;
      }
    }

    if (newExpenses.length > 0) {
      await Expense.insertMany(newExpenses);
    }

    res.status(200).json({
      message: `Successfully copied ${copiedCount} fixed expenses`,
      count: copiedCount,
    });

  } catch (error) {
    console.error("Error in copyFixedExpenses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  addExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getTotalExpense,
  getExpensesByOrder,
  getMonthlyExpenses,
  getMonthExpenses,
  copyFixedExpenses,
};
