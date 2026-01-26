import bcrypt from "bcryptjs";
import { User } from "../models/UserSchema.js";
import { RecentActivity } from "../models/RecentActivitySchema.js";
import { sendEmail } from "../utils/Mailer.js";

// ========================= Helpers ========================= //

const hashPasswordIfNeeded = async (password) => {
  if (!password) return null;
  return bcrypt.hash(password, 10);
};

const appendBankDetails = (updateObj, bankDetails) => {
  if (!bankDetails || typeof bankDetails !== "object") return;

  Object.keys(bankDetails).forEach((key) => {
    updateObj[`BankDetails.${key}`] = bankDetails[key];
  });
};

const saveDocumentFile = (updateObj, files, field) => {
  if (!files[field] || !files[field][0]) return;

  updateObj[`Documents.${field}`] = {
    filename: files[field][0].originalname,
    filepath: files[field][0].path,
    uploadedAt: new Date(),
  };
};
//=========================Generate Employee Code (Ex:DIS-11001)============//
const generateEmployeeCode = async () => {
  // Use aggregation to compute numeric part and get max without scanning all documents into app memory
  const res = await User.aggregate([
    { $match: { role: "Employee", EmployeeCode: { $exists: true, $ne: "" } } },
    {
      $project: {
        codeStr: "$EmployeeCode",
        // Remove DIS-11 prefix if present, else keep original
        numericPart: {
          $toInt: {
            $cond: [
              {
                $regexMatch: { input: "$EmployeeCode", regex: /^DIS-11(\d+)$/ },
              },
              {
                $replaceOne: {
                  input: "$EmployeeCode",
                  find: "DIS-11",
                  replacement: "",
                },
              },
              "0",
            ],
          },
        },
      },
    },
    { $group: { _id: null, maxNum: { $max: "$numericPart" } } },
  ]);

  const maxNumber = res[0]?.maxNum || 0; // default baseline 0, so next is 1
  const nextNumber = maxNumber + 1;
  const formatted = String(nextNumber).padStart(3, "0");
  return `DIS-11${formatted}`;
};

// ========================= Add User ========================= //

const addUser = async (req, res) => {
  try {
    const {
      Name,
      Email,
      Phone,
      Password,
      role,
      CompanyId,
      DepartmentId,
      DesignationId,
      BranchId,
      JoiningDate,
      createdBy,
      BankDetails,
      DateOfBirth,
      AdhaarNumber,
      PANNumber,
      EmployeeType,
    } = req.body;

    // Sanitize ObjectIds (handle empty strings)
    const deptId = DepartmentId && DepartmentId !== "" ? DepartmentId : undefined;
    const desigId = DesignationId && DesignationId !== "" ? DesignationId : undefined;
    const branchId = BranchId && BranchId !== "" ? BranchId : undefined;

    // Check existing
    if (await User.findOne({ Email }))
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await hashPasswordIfNeeded(Password);

    // Prepare documents
    const documents = {};

    if (req.files) {
      // FIXED: Use correct field names matching the route
      if (req.files.BankPassbook?.[0]) {
        documents.BankPassbook = {
          filename: req.files.BankPassbook[0].originalname,
          filepath: req.files.BankPassbook[0].path,
          uploadedAt: new Date(),
        };
      }

      if (req.files.AadhaarCard?.[0]) {
        documents.AdhaarCard = {
          filename: req.files.AadhaarCard[0].originalname,
          filepath: req.files.AadhaarCard[0].path,
          uploadedAt: new Date(),
        };
      }

      if (req.files.PANCard?.[0]) {
        documents.PANCard = {
          filename: req.files.PANCard[0].originalname,
          filepath: req.files.PANCard[0].path,
          uploadedAt: new Date(),
        };
      }

      // Marksheets
      if (req.files.Marksheets?.length > 0) {
        documents.Marksheets = req.files.Marksheets.map((file) => ({
          filename: file.originalname,
          filepath: file.path,
          documentType: file.originalname.includes("10th")
            ? "10th"
            : file.originalname.includes("12th")
              ? "12th"
              : file.originalname.includes("Graduation")
                ? "Graduation"
                : "Other",
          uploadedAt: new Date(),
        }));
      }
      // Other Documents
      if (req.files.OtherDocuments?.length > 0) {
        documents.OtherDocuments = req.files.OtherDocuments.map((file) => ({
          filename: file.originalname,
          filepath: file.path,
          documentType: file.originalname.split(".")[0] || "Other",
          uploadedAt: new Date(),
        }));
      }
    }
    //============================Generate Employeee Code==========================================
    //============================Generate Employeee Code==========================================
    let generatedCode = null;
    if (req.body.role === "Employee") {
      generatedCode = await generateEmployeeCode();
    }

    //===========================Creating User=======================================================
    const newUser = await User.create({
      Name,
      Email,
      Phone,
      Password: hashedPassword,
      role,
      CompanyId,
      role,
      CompanyId,
      DepartmentId: deptId,
      DesignationId: desigId,
      BranchId: branchId,
      EmployeeCode: generatedCode,
      EmployeeCode: generatedCode,
      JoiningDate,
      createdBy,
      BankDetails,
      DateOfBirth,
      AdhaarNumber,
      PANNumber,
      EmployeeType,
      ProfilePhoto: req.files?.ProfilePhoto?.[0]?.path || "",
      Documents: documents,
    });

    // Activity Log
    // Activity Log
    // Activity Log
    // Activity Log
    // Activity Log
    const activity = await RecentActivity.create({
      CompanyId,
      userId: req.user?._id || createdBy, // Person who added the user
      action: "added",
      target: `${role} ${Name}`, // Use the actual role (Employee, HR, CA, etc.)
    });

    // Email Notification
    // Email Notification (Fire and Forget)
    sendEmail({
      to: ["sharmachetan20082000@gmail.com"],
      subject: `New Employee Added: ${Name}`,
      text: `New employee added: ${Name}`,
    })
      .then(async () => {
        activity.isEmailSent = true;
        await activity.save();
      })
      .catch(async (err) => {
        console.error("Email sending failed:", err);
        await activity.save(); // still log even if email fails
      });

    res.status(201).json({
      success: true,
      message: "User created",
      user: newUser,
    });
  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========================= Update User ========================= //

const updateUser = async (req, res) => {
  try {
    // FIXED: Read id from params instead of body
    const { id } = req.params;
    const { Password, BankDetails, ...fields } = req.body;

    const updateObj = { ...fields };

    // Sanitize ObjectIds in update
    if (updateObj.DepartmentId === "") updateObj.DepartmentId = null; // Unset if empty
    if (updateObj.DesignationId === "") updateObj.DesignationId = null;
    if (updateObj.BranchId === "") updateObj.BranchId = null;

    // Hash password only if provided
    if (Password) updateObj.Password = await hashPasswordIfNeeded(Password);

    // Apply bank details
    appendBankDetails(updateObj, BankDetails);

    // RESTRICT EMPLOYEE FROM UPDATING EXISTING DOCUMENTS
    if (req.files && req.user?.role === "Employee") {
      const currentUser = await User.findById(id);
      if (currentUser) {
        if (req.files.BankPassbook && currentUser.Documents?.BankPassbook?.filepath) {
          return res.status(403).json({ success: false, message: "You cannot update the Bank Passbook as it has already been uploaded." });
        }
        if (req.files.AadhaarCard && currentUser.Documents?.AdhaarCard?.filepath) {
          return res.status(403).json({ success: false, message: "You cannot update the Aadhaar Card as it has already been uploaded." });
        }
        if (req.files.PANCard && currentUser.Documents?.PANCard?.filepath) {
          return res.status(403).json({ success: false, message: "You cannot update the PAN Card as it has already been uploaded." });
        }
      }
    }

    // File uploads - FIXED: Use correct field names
    if (req.files) {
      if (req.files.BankPassbook?.[0]) {
        updateObj["Documents.BankPassbook"] = {
          filename: req.files.BankPassbook[0].originalname,
          filepath: req.files.BankPassbook[0].path,
          uploadedAt: new Date(),
        };
      }

      if (req.files.AadhaarCard?.[0]) {
        updateObj["Documents.AdhaarCard"] = {
          filename: req.files.AadhaarCard[0].originalname,
          filepath: req.files.AadhaarCard[0].path,
          uploadedAt: new Date(),
        };
      }

      if (req.files.PANCard?.[0]) {
        updateObj["Documents.PANCard"] = {
          filename: req.files.PANCard[0].originalname,
          filepath: req.files.PANCard[0].path,
          uploadedAt: new Date(),
        };
      }

      // Profile Photo
      if (req.files.ProfilePhoto?.[0])
        updateObj.ProfilePhoto = req.files.ProfilePhoto[0].path;

      // Marksheets append
      if (req.files.Marksheets?.length > 0) {
        const user = await User.findById(id);
        const prev = user?.Documents?.Marksheets || [];

        const newFiles = req.files.Marksheets.map((file) => ({
          filename: file.originalname,
          filepath: file.path,
          documentType: file.originalname.includes("10th")
            ? "10th"
            : file.originalname.includes("12th")
              ? "12th"
              : file.originalname.includes("Graduation")
                ? "Graduation"
                : "Other",
          uploadedAt: new Date(),
        }));

        updateObj["Documents.Marksheets"] = [...prev, ...newFiles];
      }
      // Other Documents - append
      if (req.files.OtherDocuments?.length > 0) {
        const user = await User.findById(id);
        const prevDocs = user?.Documents?.OtherDocuments || [];

        const newDocs = req.files.OtherDocuments.map((file) => ({
          filename: file.originalname,
          filepath: file.path,
          documentType: file.originalname.split(".")[0] || "Other",
          uploadedAt: new Date(),
        }));

        updateObj["Documents.OtherDocuments"] = [...prevDocs, ...newDocs];
      }
    }

    // Prevent empty update
    if (Object.keys(updateObj).length === 0)
      return res.status(400).json({ message: "Nothing to update" });

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    // Only log activity if the updater is NOT an employee (e.g. Admin or HR)
    if (req.user?.role !== "Employee") {
      await RecentActivity.create({
        CompanyId: updated.CompanyId,
        userId: req.user?._id, // Person who updated
        action: "updated",
        target: `${updated.role} ${updated.Name}`, // Use the actual role
      });
    }
    res.json({ success: true, message: "Updated", user: updated });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========================= Delete User ========================= //

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const removed = await User.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: "User not found" });

    await RecentActivity.create({
      CompanyId: removed.CompanyId,
      userId: req.user?._id, // Person who deleted
      action: "deleted",
      target: `${removed.role} ${removed.Name}`, // Use the actual role
    });

    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================= Get All Users ========================= //

const getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.CompanyId) filter.CompanyId = req.query.CompanyId;
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .populate("CompanyId")
      .populate("DepartmentId")
      .populate("DesignationId")
      .populate("BranchId");

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================= Get User by ID ========================= //

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate("CompanyId")
      .populate("DepartmentId")
      .populate("DesignationId")
      .populate("BranchId");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================= Count Employees ========================= //

const countEmployees = async (req, res) => {
  try {
    const total = await User.countDocuments(
      req.query.CompanyId ? { CompanyId: req.query.CompanyId } : {}
    );

    res.json({ success: true, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================= Count by Department ========================= //

const countEmployeesByDepartment = async (req, res) => {
  try {
    const match = req.query.CompanyId ? { CompanyId: req.query.CompanyId } : {};

    const result = await User.aggregate([
      { $match: match },
      { $group: { _id: "$DepartmentId", total: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "info",
        },
      },
      { $unwind: "$info" },
      {
        $project: {
          DepartmentId: "$_id",
          DepartmentName: "$info.DepartmentName",
          total: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateHRProfile = async (req, res) => {
  try {
    // Get logged-in user ID from middleware (already verified by verifyToken)
    const loggedInUserId = req.user._id;

    // Fetch the current user with all fields
    const currentUser = await User.findById(loggedInUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { Password, BankDetails, ...fields } = req.body;

    // Fields that HR can update themselves
    const allowedFields = [
      "Name",
      "Phone",
      "DateOfBirth",
      "AdhaarNumber",
      "PANNumber",
      "BankDetails",
      "Password",
    ];

    // Filter out fields that aren't allowed to be updated by HR themselves
    const updateObj = {};
    Object.keys(fields).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateObj[key] = fields[key];
      }
    });

    // Hash password if provided
    if (Password) {
      updateObj.Password = await hashPasswordIfNeeded(Password);
    }

    // Apply bank details
    appendBankDetails(updateObj, BankDetails);

    // Handle file uploads
    if (req.files) {
      // Profile Photo
      if (req.files.ProfilePhoto?.[0]) {
        updateObj.ProfilePhoto = req.files.ProfilePhoto[0].path;
      }

      // Bank Passbook
      if (req.files.BankPassbook?.[0]) {
        updateObj["Documents.BankPassbook"] = {
          filename: req.files.BankPassbook[0].originalname,
          filepath: req.files.BankPassbook[0].path,
          uploadedAt: new Date(),
        };
      }

      // Aadhaar Card
      if (req.files.AadhaarCard?.[0]) {
        updateObj["Documents.AdhaarCard"] = {
          filename: req.files.AadhaarCard[0].originalname,
          filepath: req.files.AadhaarCard[0].path,
          uploadedAt: new Date(),
        };
      }

      // PAN Card
      if (req.files.PANCard?.[0]) {
        updateObj["Documents.PANCard"] = {
          filename: req.files.PANCard[0].originalname,
          filepath: req.files.PANCard[0].path,
          uploadedAt: new Date(),
        };
      }

      // Marksheets - append to existing
      if (req.files.Marksheets?.length > 0) {
        const prevMarksheets = currentUser?.Documents?.Marksheets || [];

        const newMarksheets = req.files.Marksheets.map((file) => ({
          filename: file.originalname,
          filepath: file.path,
          documentType: file.originalname.includes("10th")
            ? "10th"
            : file.originalname.includes("12th")
              ? "12th"
              : file.originalname.includes("Graduation")
                ? "Graduation"
                : "Other",
          uploadedAt: new Date(),
        }));

        updateObj["Documents.Marksheets"] = [
          ...prevMarksheets,
          ...newMarksheets,
        ];
      }

      // Other Documents - append to existing
      if (req.files.OtherDocuments?.length > 0) {
        const prevDocs = currentUser?.Documents?.OtherDocuments || [];

        const newDocs = req.files.OtherDocuments.map((file) => ({
          filename: file.originalname,
          filepath: file.path,
          documentType: file.originalname.split(".")[0] || "Other",
          uploadedAt: new Date(),
        }));

        updateObj["Documents.OtherDocuments"] = [...prevDocs, ...newDocs];
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      loggedInUserId,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).select("-Password"); // Don't return password in response

    // Log activity
    // Log activity
    await RecentActivity.create({
      CompanyId: updatedUser.CompanyId,
      userId: loggedInUserId,
      action: "updated",
      target: `${updatedUser.role} ${updatedUser.Name}`, // Use the actual role
    });
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update HR Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================= Get Logged-in HR Profile ========================= //

const getHRProfile = async (req, res) => {
  try {
    // Get logged-in user ID from middleware
    const loggedInUserId = req.user._id;

    const user = await User.findById(loggedInUserId)
      .select("-Password")
      .populate("CompanyId")
      .populate("DepartmentId")
      .populate("DesignationId")
      .populate("BranchId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get HR Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//========================Get Only Employee Details===============================//
const getEmployeeInfoById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    // Fetch user & EXCLUDE password
    const user = await User.findById(id).select("-Password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (user.role !== "Employee") {
      return res.status(400).json({
        success: false,
        message: "User is not an Employee",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      user,
    });
  } catch (error) {
    console.error("getEmployeeInfoById Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export {
  addUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  countEmployees,
  countEmployeesByDepartment,
  updateHRProfile,
  getHRProfile,
  getEmployeeInfoById,
};
