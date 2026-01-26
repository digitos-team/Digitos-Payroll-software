import express from "express";
import { applyLeave, getAllLeaves, updateLeaveStatus, getLeaveBalance, getLeavesByEmployeeId } from "../controller/LeaveController.js";

const LeaveRoutes = express.Router();

LeaveRoutes.post("/leave/apply", applyLeave);
LeaveRoutes.get("/leave/list", getAllLeaves);
LeaveRoutes.put("/leave/status", updateLeaveStatus);
LeaveRoutes.get("/leave/balance", getLeaveBalance);
LeaveRoutes.post("/leave/by-employee", getLeavesByEmployeeId);
export default LeaveRoutes;