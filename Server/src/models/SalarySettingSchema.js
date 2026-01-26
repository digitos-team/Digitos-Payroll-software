import mongoose from "mongoose";

const SalarySettingsSchema = new mongoose.Schema(
  {
    CompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    EmployeeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    EffectFrom: {
      type: Date,
      default: Date.now,
    },

    // Salary breakup per head (Basic, HRA, Allowance, etc.)
    SalaryHeads: [
      {
        SalaryHeadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SalaryHeads",
          required: true,
        },
        applicableValue: {
          type: Number, // Direct amount (like 20000)
    
        },
        percentage: {
          type: Number, // e.g. 10 means 10% of base or parent head
          
        },
      },
    ],

    // Whether tax slabs should be applied when calculating salary
    isTaxApplicable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const SalarySettings = mongoose.model("SalarySettings", SalarySettingsSchema);
