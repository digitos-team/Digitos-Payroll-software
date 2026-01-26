import express from "express";
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


const SalarySettingRoutes = express.Router();

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

export default SalarySettingRoutes;
