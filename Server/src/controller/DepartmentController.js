
import { Department } from "../models/DepartmentSchema.js";

// -------------------- Add Department --------------------
const addDepartment = async (req, res) => {
  try {
    const { DepartmentName, Description, CompanyId } = req.body;

    if (!DepartmentName || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "DepartmentName and CompanyId are required.",
      });
    }

    // Check for duplicate department in the same company
    const existing = await Department.findOne({ DepartmentName, CompanyId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Department already exists for this company.",
      });
    }

    const department = await Department.create({ DepartmentName, Description, CompanyId });

    res.status(201).json({
      success: true,
      message: "Department created successfully.",
      data: department,
    });
  } catch (error) {
    console.error("addDepartment Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating department.",
    });
  }
};

// -------------------- Fetch Departments by Company --------------------
const getDepartmentsByCompany = async (req, res) => {
  try {
    const { CompanyId } = req.body;
    if (!CompanyId) return res.status(400).json({ success: false, message: "CompanyId is required." });

    const departments = await Department.find({ CompanyId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Departments fetched successfully.",
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error("getDepartmentsByCompany Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching departments.",
    });
  }
};

// -------------------- Delete Department --------------------
const deleteDepartment = async (req, res) => {
  try {
    const { DepartmentId } = req.params;

    const deleted = await Department.findByIdAndDelete(DepartmentId);
    if (!deleted) return res.status(404).json({ success: false, message: "Department not found." });

    res.status(200).json({ success: true, message: "Department deleted successfully.", data: deleted });
  } catch (error) {
    console.error("deleteDepartment Error:", error);
    res.status(500).json({ success: false, message: "Server error while deleting department." });
  }
};

// -------------------- Count Departments by Company --------------------
const countDepartmentsByCompany = async (req, res) => {
  try {
    const { CompanyId } = req.params;
    if (!CompanyId) return res.status(400).json({ success: false, message: "CompanyId is required." });

    const count = await Department.countDocuments({ CompanyId });

    res.status(200).json({
      success: true,
      message: "Total departments counted successfully.",
      CompanyId,
      count,
    });
  } catch (error) {
    console.error("countDepartmentsByCompany Error:", error);
    res.status(500).json({ success: false, message: "Server error while counting departments." });
  }
};

export {
  addDepartment,
  getDepartmentsByCompany,
  deleteDepartment,
  countDepartmentsByCompany,
};
