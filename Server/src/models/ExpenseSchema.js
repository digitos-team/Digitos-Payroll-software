import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    CompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    Month: { type: String },
    // BranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

    // 🔹 Optional — only for order-related expenses
    OrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },

    ExpenseTitle: { type: String, required: true },
    ExpenseType: {
      type: String,
      enum: [
        "Operational",
        "Administrative",
        "Employee Welfare",
        "Maintenance",
        "Utilities",
        "Other",
        "Salary",
      ],
      default: "Other",
    },
    Amount: { type: Number, required: true },
    ExpenseDate: { type: Date, default: Date.now },
    PaymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Cheque", "UPI", "Card"],
      default: "Bank Transfer",
    },
<<<<<<< HEAD
=======
    isFixed: {
      type: Boolean,
      default: false,
    },
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
    // VendorName: { type: String },
    // InvoiceNumber: { type: String },
    Description: { type: String },

    Receipt: { type: String },
    // Track who added the expense (allow populate on AddedBy)
    AddedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // ReceiptFile: { type: String },
    // ReceiptPath: { type: String },
    // Status: {
    //   type: String,
    //   enum: ["Pending", "Verified", "Rejected"],
    //   default: "Pending",
    // },
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", ExpenseSchema);
