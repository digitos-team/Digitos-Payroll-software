import mongoose from "mongoose";

const SalarySlipRequestSchema = new mongoose.Schema(
  {
    EmployeeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    CompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    Month: {
      type: String,
      required: true,
      // Format: "2025-11"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // HR who approved/rejected
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    // Optional: Track if employee has downloaded after approval
    downloadedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries
SalarySlipRequestSchema.index({ EmployeeID: 1, Month: 1, CompanyId: 1 });
SalarySlipRequestSchema.index({ status: 1, CompanyId: 1 });

export const SalarySlipRequest = mongoose.model("SalarySlipRequest", SalarySlipRequestSchema);  