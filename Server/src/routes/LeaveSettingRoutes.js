import express from "express";
import { updateSettings, getSettings } from "../controller/LeaveSettingController.js";

const LeaveSettingRoutes = express.Router();

LeaveSettingRoutes.post("/leaves/settings/update", updateSettings);
LeaveSettingRoutes.get("/leaves/settings/:CompanyId", getSettings);

export default LeaveSettingRoutes;