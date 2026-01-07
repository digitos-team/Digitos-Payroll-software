import mongoose from "mongoose";
const RecentActivitySchema = new mongoose.Schema({
  CompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who triggered action
  action: { type: String, required: true, default:"Unknown" },
  target: { type: String }, // e.g., Employee, Payroll
  createdAt: { type: Date, default: Date.now },
  isEmailSent: { type: Boolean, default: false },

  }, { timestamps: true });

export const RecentActivity = mongoose.model("RecentActivity", RecentActivitySchema);
