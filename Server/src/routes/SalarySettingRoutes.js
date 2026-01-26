import express from "express";
import { addOrUpdateSalarySetting, deleteSalarySetting, getSalarySettingsByCompany } from "../controller/SalarySettingController.js";


const SalarySettingRoutes = express.Router();

SalarySettingRoutes.post("/addsalarysettings", addOrUpdateSalarySetting);
SalarySettingRoutes.post("/getsalarysettings", getSalarySettingsByCompany);
SalarySettingRoutes.delete("/deletesalarysetting", deleteSalarySetting);

export default SalarySettingRoutes;
