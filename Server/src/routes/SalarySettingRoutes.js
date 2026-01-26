import express from "express";
<<<<<<< HEAD
import {
    addOrUpdateSalarySetting,
    deleteSalarySetting,
    getSalarySettingsByCompany,
    fetchSalaryRequests,
    approveSalaryRequest,
    rejectSalaryRequest,
    getHRNotifications,
    markNotificationRead
} from "../controller/SalarySettingController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";
=======
import { addOrUpdateSalarySetting, deleteSalarySetting, getSalarySettingsByCompany } from "../controller/SalarySettingController.js";
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70


const SalarySettingRoutes = express.Router();

<<<<<<< HEAD
SalarySettingRoutes.post("/addsalarysettings", verifyToken, addOrUpdateSalarySetting);
SalarySettingRoutes.post("/getsalarysettings", verifyToken, getSalarySettingsByCompany);
SalarySettingRoutes.delete("/deletesalarysetting", verifyToken, deleteSalarySetting);

// Approval Workflow Routes
SalarySettingRoutes.post("/fetchsalaryrequests", verifyToken, fetchSalaryRequests);
SalarySettingRoutes.post("/approvesalaryrequest", verifyToken, approveSalaryRequest);
SalarySettingRoutes.post("/rejectsalaryrequest", verifyToken, rejectSalaryRequest);

// HR Notifications
SalarySettingRoutes.get("/hr-notifications", verifyToken, getHRNotifications);
SalarySettingRoutes.post("/mark-notification-read", verifyToken, markNotificationRead);
=======
SalarySettingRoutes.post("/addsalarysettings", addOrUpdateSalarySetting);
SalarySettingRoutes.post("/getsalarysettings", getSalarySettingsByCompany);
SalarySettingRoutes.delete("/deletesalarysetting", deleteSalarySetting);
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70

export default SalarySettingRoutes;
