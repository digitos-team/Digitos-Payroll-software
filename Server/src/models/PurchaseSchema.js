import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    CompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    BranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    OrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    PurchaseTitle: { type: String, required: true }, // e.g., "Freelancer Payment", "Domain Purchase"
    Description: { type: String },
    VendorName: { type: String },
    Amount: { type: Number, required: true },

    PaymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    Status: {
      type: String,
      enum: ["Unapproved", "Approved"],
      default: "Unapproved",
    },

    AddedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);
