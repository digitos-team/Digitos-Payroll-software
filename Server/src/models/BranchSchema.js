import mongoose from "mongoose";

let BranchSchema = mongoose.Schema(
  {
    BranchName: { type: String },
    BranchAddress: { type: String },

    BranchCity: { type: String },
    BranchState: { type: String },
    BranchPinCode: { type: Number },

    CompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);
export const Branch = mongoose.model("Branch", BranchSchema);
