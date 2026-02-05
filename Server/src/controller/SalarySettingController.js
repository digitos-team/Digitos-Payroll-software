import mongoose from "mongoose";
import { SalarySettings } from "../models/SalarySettingSchema.js";
import { SalaryConfigurationRequest } from "../models/SalaryConfigurationRequestSchema.js";


const addOrUpdateSalarySetting = async (req, res) => {
  try {
    let { CompanyId, EmployeeID, EffectFrom, SalaryHeads, isTaxApplicable } = req.body;

    // DEBUG

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

    // 4️⃣ Check User Role & Handle accordingly
    const userRole = req.user.role;
    const requesterId = req.user._id;



    // LOGIC: If HR, create a request. If Admin, update directly.
    if (userRole === "HR") {
      // Change Detection Block
      if (existingSetting) {
        const isTaxChanged = existingSetting.isTaxApplicable !== isTaxApplicable;

        // Normalize and compare heads
        const incomingHeads = [...SalaryHeads].sort((a, b) =>
          String(a.SalaryHeadId).localeCompare(String(b.SalaryHeadId))
        );
        const existingHeads = [...existingSetting.SalaryHeads].sort((a, b) =>
          String(a.SalaryHeadId).localeCompare(String(b.SalaryHeadId))
        );

        let headsChanged = incomingHeads.length !== existingHeads.length;

        if (!headsChanged) {
          for (let i = 0; i < incomingHeads.length; i++) {
            const inc = incomingHeads[i];
            const ext = existingHeads[i];

            if (
              String(inc.SalaryHeadId) !== String(ext.SalaryHeadId) ||
              Number(inc.applicableValue) !== Number(ext.applicableValue) ||
              Number(inc.percentage) !== Number(ext.percentage)
            ) {
              headsChanged = true;
              break;
            }
          }
        }

        if (!isTaxChanged && !headsChanged) {
          return res.status(200).json({
            success: false,
            message: "No changes detected in salary configuration."
          });
        }
      }

      const salaryRequest = await SalaryConfigurationRequest.create({
        CompanyId,
        EmployeeID,
        RequestedBy: requesterId,
        SalaryHeads,
        EffectFrom,
        isTaxApplicable,
        Status: "Pending"
      });

      return res.status(200).json({
        success: true,
        message: "Salary configuration request sent for approval.",
        data: salaryRequest,
        isRequest: true
      });
    }

    // IF ADMIN: Proceed with direct update/create (Existing Logic)

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

    // 5️⃣ Create new setting
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
// ➤ Fetch Salary Requests
const fetchSalaryRequests = async (req, res) => {
  try {
    const { companyId } = req.body;
    const requests = await SalaryConfigurationRequest.find({ CompanyId: companyId, Status: "Pending" })
      .populate("EmployeeID", "Name Email Department Designation")
      .populate("RequestedBy", "Name Email")
      .populate("SalaryHeads.SalaryHeadId", "SalaryHeadsTitle SalaryHeadsType ShortName");

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching requests", error: error.message });
  }
};

// ➤ Approve Salary Request
const approveSalaryRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await SalaryConfigurationRequest.findById(requestId);

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Update or Create Salary Setting
    let setting = await SalarySettings.findOne({ CompanyId: request.CompanyId, EmployeeID: request.EmployeeID });

    if (setting) {
      setting.SalaryHeads = request.SalaryHeads;
      setting.EffectFrom = request.EffectFrom;
      setting.isTaxApplicable = request.isTaxApplicable;
      await setting.save();
    } else {
      await SalarySettings.create({
        CompanyId: request.CompanyId,
        EmployeeID: request.EmployeeID,
        SalaryHeads: request.SalaryHeads,
        EffectFrom: request.EffectFrom,
        isTaxApplicable: request.isTaxApplicable
      });
    }

    request.Status = "Approved";
    await request.save();

    res.status(200).json({ success: true, message: "Request approved and salary updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error approving request", error: error.message });
  }
};

// ➤ Reject Salary Request
const rejectSalaryRequest = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const request = await SalaryConfigurationRequest.findByIdAndUpdate(
      requestId,
      { Status: "Rejected", RejectionReason: reason },
      { new: true }
    );
    res.status(200).json({ success: true, message: "Request rejected.", data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error rejecting request", error: error.message });
  }
};



// ➤ Get HR Notifications (Resolved Requests)
const getHRNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find requests created by this HR that are Approved/Rejected and not read
    const notifications = await SalaryConfigurationRequest.find({
      RequestedBy: userId,
      Status: { $in: ["Approved", "Rejected"] },
      IsRead: false
    })
      .populate("EmployeeID", "Name")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications", error: error.message });
  }
};

// ➤ Mark Notification as Read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.body;
    await SalaryConfigurationRequest.findByIdAndUpdate(id, { IsRead: true });
    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating notification", error: error.message });
  }
};


export {
  addOrUpdateSalarySetting,
  getSalarySettingsByCompany,
  deleteSalarySetting,
  fetchSalaryRequests,
  approveSalaryRequest,
  rejectSalaryRequest,
  getHRNotifications,
  markNotificationRead
};
