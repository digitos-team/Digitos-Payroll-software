import mongoose from "mongoose";

const TaxSlabSchema = new mongoose.Schema({
  minIncome: {
    type: Number,
    required: true,
  },
  maxIncome: {
    type: Number,
    // default: null, // null means no upper limit
  },
  taxRate: {
    type: Number,
    required: true, // percentage, e.g., 5 means 5%
  },
  description: {
    type: String,
  },
  effectiveFrom: {
    type: Date,
    default: Date.now, // useful if slabs change next year
  },
//   isActive: {
//     type: Boolean,
//     default: true, // only active slabs are used
//   },
    CompanyId:{type:mongoose.Schema.Types.ObjectId, ref:"Company"}
}, { timestamps: true });

export const TaxSlab = mongoose.model("TaxSlab", TaxSlabSchema);
