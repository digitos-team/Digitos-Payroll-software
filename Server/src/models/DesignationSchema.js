import mongoose from "mongoose";

const DesignationSchema = new mongoose.Schema(
  {
    DesignationName: {
      type: String,
      required: true,
      trim: true,
    },
    Description: {
      type: String,
      trim: true,
    },

    CompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    Level: {
      type: String,
      enum: ["Junior", "Mid", "Senior", "Manager", "Director"],
      default: "Junior",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export const Designation = mongoose.model("Designation", DesignationSchema);
