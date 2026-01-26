import mongoose from "mongoose";
import { SalarySettings } from "../models/SalarySettingSchema.js";


const addOrUpdateSalarySetting = async (req, res) => {
  try {
    let { CompanyId, EmployeeID, EffectFrom, SalaryHeads, isTaxApplicable } = req.body;

    // DEBUG
    console.log("=== SAVING SALARY SETTING ===");
    console.log("isTaxApplicable received:", isTaxApplicable);
    console.log("typeof isTaxApplicable:", typeof isTaxApplicable);
    
    // ... rest of code
    // 1️⃣ Find basic head (percentage == 0)
    const basicHead = SalaryHeads.find(
      (h) => Number(h.percentage) === 0
    );

    if (!basicHead || !basicHead.applicableValue) {
      return res.status(400).json({
        success: false,
        message: "Basic salary must be entered before percentage-based heads",
      });
    }

    const basicSalary = Number(basicHead.applicableValue);

    // 2️⃣ Calculate applicableValue for all percentage heads
    SalaryHeads = SalaryHeads.map((h) => {
      if (Number(h.percentage) === 0) {
        // Basic salary, nothing to compute
        return h;
      }

      const percent = Number(h.percentage);
      const calculated = (basicSalary * percent) / 100;

      return {
        ...h,
        applicableValue: Number(calculated.toFixed(2)),
      };
    });

    // 3️⃣ Check for existing setting
    let existingSetting = await SalarySettings.findOne({
      CompanyId,
      EmployeeID,
    });

    if (existingSetting) {
      existingSetting.SalaryHeads = SalaryHeads;
      existingSetting.EffectFrom = EffectFrom || existingSetting.EffectFrom;
      existingSetting.isTaxApplicable = isTaxApplicable;

      await existingSetting.save();

      return res.status(200).json({
        success: true,
        message: "Salary setting updated successfully",
        data: existingSetting,
      });
    }

    // 4️⃣ Create new setting
    const newSetting = await SalarySettings.create({
      CompanyId,
      EmployeeID,
      EffectFrom,
      SalaryHeads,
      isTaxApplicable,
    });

    return res.status(201).json({
      success: true,
      message: "Salary setting created successfully",
      data: newSetting,
    });

  } catch (error) {
    console.error("Error saving salary setting:", error);

    return res.status(500).json({
      success: false,
      message: "Error saving salary setting",
      error: error.message,
    });
  }
};
const getSalarySettingsByCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid Company ID format" });
    }

    const settings = await SalarySettings.find({
      CompanyId: new mongoose.Types.ObjectId(companyId),
    })
      .populate("EmployeeID", "Name Email")
     .populate("SalaryHeads.SalaryHeadId", "SalaryHeadsTitle SalaryHeadsType ShortName");  // <-- FIXED

    if (settings.length === 0) {
      return res.status(404).json({ message: "No salary settings found" });
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching salary settings",
      error: error.message,
    });
  }
};
// ➤ Delete Salary Setting
const deleteSalarySetting = async (req, res) => {
  try {
    const { id } = req.body;  // ← Change this line
    await SalarySettings.findByIdAndDelete(id);
    res.status(200).json({ message: "Salary setting deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting salary setting",
      error: error.message,
    });
  }
};
export {
  addOrUpdateSalarySetting,
  getSalarySettingsByCompany,
  deleteSalarySetting,
};
