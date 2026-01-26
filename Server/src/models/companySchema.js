import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    AdminName: { type: String, required: true },
    AdminEmail: { type: String, required: true, unique: true },
    AdminPhone: { type: String, required: true },

    AdminPassword: { type: String, required: true },

    // COMPANY DETAILS
    CompanyName: { type: String, required: true },
    RegistrationNo: { type: String, required: true, unique: true },
    CompanyType: {
      type: String,
      enum: ["Private Ltd", "Partnership", "Public Ltd"],
      required: true,
    },
    CompanyIndustry: { type: String },
    CompanyEmail: { type: String, required: true },
    CompanyPhone: { type: String },
    CompanyWebsite: { type: String },

    //  COMPANY ADDRESS
    CompanyAddress: { type: String, required: true },
    CompanyCity: { type: String, required: true },
    CompanyState: { type: String, required: true },
    CompanyPincode: { type: String, required: true },

    //  STATUTORY DETAILS
    GstNumber: { type: String },
    PanNumber: { type: String },
    //    esiCode: { type: String },
    //     epfCode: { type: String },
    //     lwfCode: { type: String },
    professionalTaxCode: { type: String },

    //  BANK DETAILS
    bankName: { type: String },
    bankBranch: { type: String },
    bankAccountNumber: { type: String },
    bankIFSC: { type: String },

    //  STATUS & CONTROL
    role: { type: String, default: "Admin" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);
// CompanySchema.pre("save", async function (next) {
//   if (!this.isModified("AdminPassword")) return next();
//   this.AdminPassword = await bcrypt.hash(this.AdminPassword, 10);
//   next();
// });
export const Company = mongoose.model("Company", CompanySchema);
