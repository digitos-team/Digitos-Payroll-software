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
      DepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
      BranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, 
  },
  { timestamps: true }
);

export const SalarySlip = mongoose.model("SalarySlip", SalarySlipSchema);
