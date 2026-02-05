import mongoose from "mongoose";

const SalarySlipSchema = new mongoose.Schema(
  {
    CompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    EmployeeID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Month: { type: String, required: true }, // e.g., "2025-11"
    Earnings: [
      {
        title: String,
        shortName: String,
        amount: Number,
      },
    ],
    Deductions: [
      {
        title: String,
        shortName: String,
        amount: Number,
      },
    ],
    totalEarnings: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    TaxAmount: { type: Number, default: 0 },
    // Attendance breakdown
    attendanceSummary: {
      totalWorkingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      unpaidLeaves: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      paidLeaves: { type: Number, default: 0 },
      leaveDeductionAmount: { type: Number, default: 0 },
    },
    DepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    BranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true }
);

SalarySlipSchema.index({ CompanyId: 1, EmployeeID: 1, Month: 1 }, { unique: true });

export const SalarySlip = mongoose.model("SalarySlip", SalarySlipSchema);
