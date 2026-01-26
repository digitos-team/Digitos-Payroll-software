import bcrypt from "bcryptjs";
import { Company } from "../models/companySchema.js";

// -------------------- Register Admin + Company --------------------
const registerAdmin = async (req, res) => {
  try {
    const reqData = req.body;

    const {
      AdminName,
      AdminEmail,
      AdminPhone,
      AdminPassword,

      CompanyName,
      RegistrationNo,
      CompanyType,
      CompanyIndustry,
      CompanyEmail,
      CompanyPhone,
      CompanyWebsite,
      CompanyAddress,
      CompanyCity,
      CompanyState,
      CompanyPincode,

      GstNumber,
      PanNumber,
      professionalTaxCode,

      bankName,
      bankBranch,
      bankAccountNumber,
      bankIFSC,

      role,
    } = reqData;

    // ------------------ Validation ------------------
    if (
      !AdminName ||
      !AdminEmail ||
      !AdminPhone ||
      !AdminPassword ||
      !CompanyName ||
      !RegistrationNo ||
      !CompanyEmail ||
      !CompanyAddress ||
      !CompanyCity ||
      !CompanyState ||
      !CompanyPincode
    ) {
      return res.status(400).json({
        message: "All mandatory fields are required",
      });
    }

    // ------------------ Duplicate Check ------------------
    const existingAdmin = await Company.findOne({ AdminEmail });
    const existingCompany = await Company.findOne({ CompanyEmail });

    if (existingAdmin || existingCompany) {
      return res.status(400).json({
        message: "Admin or Company already registered",
      });
    }

    // ------------------ Password Encryption ------------------
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(AdminPassword, salt);

    // ------------------ Create Company & Admin ------------------
    const newCompany = await Company.create({
      AdminName,
      AdminEmail,
      AdminPhone,
      AdminPassword: encryptedPassword,

      CompanyName,
      RegistrationNo,
      CompanyType,
      CompanyIndustry,
      CompanyEmail,
      CompanyPhone,
      CompanyWebsite,
      CompanyAddress,
      CompanyCity,
      CompanyState,
      CompanyPincode,

      GstNumber,
      PanNumber,
      professionalTaxCode,

      bankName,
      bankBranch,
      bankAccountNumber,
      bankIFSC,

      role: role || "Admin",
    });

    res.status(201).json({
      message: "Admin and Company registered successfully",
      data: {
        _id: newCompany._id,
        AdminName: newCompany.AdminName,
        AdminEmail: newCompany.AdminEmail,
        CompanyName: newCompany.CompanyName,
        CompanyEmail: newCompany.CompanyEmail,
        CompanyState: newCompany.CompanyState,
        CompanyType: newCompany.CompanyType,
        isActive: newCompany.isActive,
        role: newCompany.role,
      },
    });
  } catch (error) {
    console.error("Error in registerAdmin:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// -------------------- Fetch All Companies --------------------
const fetchDetails = async (req, res) => {
  try {
    const result = await Company.find().select("-AdminPassword"); // exclude password
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchDetails:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
// -------------------- Update Company + Admin --------------------
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params; // Company ID from URL
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    // ----------- Fields NOT allowed to update -----------
    // ----------- Fields NOT allowed to update -----------
    const blockedFields = [
      // "AdminEmail", // Allowed now
      "CompanyEmail",
      "AdminPassword",
      "_id",
      "role",
    ];

    blockedFields.forEach((field) => {
      if (updates[field]) delete updates[field];
    });

    // ----------- Check AdminEmail Uniqueness if updating -----------
    if (updates.AdminEmail) {
      const existingAdmin = await Company.findOne({
        AdminEmail: updates.AdminEmail,
      });
      // If found someone else with this email (not me)
      if (existingAdmin && existingAdmin._id.toString() !== id) {
        return res.status(400).json({
          message: "Admin Email already in use by another account",
        });
      }
    }

    // ----------- If AdminPassword update request comes -> deny -----------
    if (req.body.AdminPassword) {
      return res.status(400).json({
        message: "Password cannot be updated from this endpoint",
      });
    }

    // ----------- Find existing company -----------
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // ----------- Update allowed fields only -----------
    Object.keys(updates).forEach((key) => {
      company[key] = updates[key];
    });

    await company.save();

    return res.status(200).json({
      message: "Company details updated successfully",
      data: company,
    });
  } catch (error) {
    console.error("Error in updateCompany:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// -------------------- Change Company Password --------------------
const changeCompanyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const adminId = req.user._id; // Assuming verifyToken middleware populates this

    console.log("Change Password Request:", { adminId, hasPassword: !!password });

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const company = await Company.findById(adminId);
    console.log("Admin Company Found:", !!company);

    if (!company) {
      return res.status(404).json({ message: "Admin account not found" });
    }


    // Encrypt new password
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    company.AdminPassword = encryptedPassword;
    await company.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in changeCompanyPassword:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { registerAdmin, fetchDetails, updateCompany, changeCompanyPassword };
