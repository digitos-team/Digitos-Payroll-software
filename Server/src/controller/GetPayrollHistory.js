import mongoose from "mongoose";
import { User } from "../models/UserSchema.js";
import { Department } from "../models/DepartmentSchema.js";
import { SalarySlip } from "../models/SalaryCalculateSchema.js";
const getPayrollHistory = async (req, res) => {
  try {
    const { CompanyId, EmployeeID, Month, Year } = req.query;

    if (!CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CompanyId is required",
      });
    }

    const matchQuery = {
      CompanyId: new mongoose.Types.ObjectId(CompanyId),
    };

    if (EmployeeID) {
      matchQuery.EmployeeID = new mongoose.Types.ObjectId(EmployeeID);
    }

    // FIXED MONTH FILTER
    if (Month) {
      if (!Year) {
        return res.status(400).json({
          success: false,
          message: "Year is required when Month is provided",
        });
      }

      const formattedMonth = `${Year}-${String(Month).padStart(2, "0")}`;
      matchQuery.Month = formattedMonth;
    }

    const pipeline = [
  { $match: matchQuery },
  {
    $lookup: {
      from: "users",
      localField: "EmployeeID",
      foreignField: "_id",
      as: "employee",
    },
  },
  {
    $unwind: {
      path: "$employee",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $lookup: {
      from: "departments",
      localField: "employee.DepartmentId",
      foreignField: "_id",
      as: "department",
    },
  },
  {
    $unwind: {
      path: "$department",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $project: {
      EmployeeName: "$employee.Name",
      DepartmentName: "$department.DepartmentName",
      Month: 1,
      grossSalary: 1,
      netSalary: 1,
      totalDeductions: 1,
      TaxAmount: 1,
      Earnings: 1,
      Deductions: 1,
    },
  },
  { $sort: { Month: -1 } },
];


    const history = await SalarySlip.aggregate(pipeline);

    res.status(200).json({
      success: true,
      CompanyId,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching payroll history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payroll history",
      error: error.message,
    });
  }
};

export { getPayrollHistory };