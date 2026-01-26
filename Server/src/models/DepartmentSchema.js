import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    DepartmentName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    Description: {
      type: String,
      trim: true,
    },
    // CreatedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User", // could be Admin or HR who created it
    //   required: true,
    // },
    CompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

export const Department = mongoose.model("Department", departmentSchema);
