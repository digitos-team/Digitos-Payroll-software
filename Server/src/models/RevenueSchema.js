import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
  {
    CompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    OrderId: {
      type: String,
      required: false,
      default: null,
    },
    Source: { type: String, default: "Client Service" },
    Amount: { type: Number, required: true },
    RevenueDate: { type: Date, default: Date.now },
    Description: { type: String },

    // Track who added it
AddedBy: {
  type: String,
  default: "Admin"
}

 // ✅ Add this
  },
  { timestamps: true }
);

export const Revenue = mongoose.model("Revenue", revenueSchema);
