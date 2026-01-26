import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // Basic info
  Name: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Phone: { type: String },
  Password: { type: String, required: true },
  role: {
    type: String,
    enum: ["HR", "Employee", "CA"],
    required: true,
  },

  // Company connection
  CompanyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },

  // Optional links (for employees)
  DepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  DesignationId: { type: mongoose.Schema.Types.ObjectId, ref: "Designation" },
  BranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

  // Employee details
  EmployeeCode: { type: String },
  EmployeeType: {
    type: String,
    enum: ["Intern", "Permanent", "Contract Base", "Others"],
  },
  JoiningDate: { type: Date },
  AdhaarNumber: { type: String },
  PANNumber: { type: String },

  // Bank Details
  BankDetails: {
    BankName: { type: String },
    AccountHolderName: { type: String },
    AccountNumber: { type: String },
    IFSCCode: { type: String },
    BranchName: { type: String },
  },

  DateOfBirth: { type: Date },

  ProfilePhoto: {
    type: String,
    default: "",
  },

  // Documents
  Documents: {
    BankPassbook: {
      filename: { type: String },
      filepath: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    },

    Marksheets: [
      {
        filename: { type: String },
        filepath: { type: String },
        documentType: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    AdhaarCard: {
      filename: { type: String },
      filepath: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    },

    PANCard: {
      filename: { type: String },
      filepath: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    },
    OtherDocuments: [
      {
        filename: { type: String },
        filepath: { type: String },
        documentType: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
  },

  // Audit info (now outside Documents)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

}, { timestamps: true });

UserSchema.index({ CompanyId: 1 });

export const User = mongoose.model("User", UserSchema);
