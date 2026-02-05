import express from "express";
import { markAttendance, getMonthlyAttendance, getEmployeeAttendance } from "../controller/AttendanceController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";
import { canMarkAttendance, canViewAttendance } from "../Middleware/attendanceMiddleware.js";

const AttendanceRoutes = express.Router();

// Mark attendance - HR/Admin only, with date locking validation
AttendanceRoutes.post("/attendance/mark", verifyToken, canMarkAttendance, markAttendance);

// Get monthly attendance report - HR/Admin/CA can view all, Employees can view own
AttendanceRoutes.get("/attendance/report", verifyToken, canViewAttendance, getMonthlyAttendance);

// Get employee-specific attendance - HR/Admin/CA can view all, Employees can view own
AttendanceRoutes.get("/attendance/employee", verifyToken, canViewAttendance, getEmployeeAttendance);

export default AttendanceRoutes;