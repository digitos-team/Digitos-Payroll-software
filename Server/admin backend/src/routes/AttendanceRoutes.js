import express from "express";
import { markAttendance, getMonthlyAttendance, getEmployeeAttendance } from "../controller/AttendanceController.js";

const AttendanceRoutes = express.Router();

AttendanceRoutes.post("/attendance/mark", markAttendance);
AttendanceRoutes.get("/attendance/report", getMonthlyAttendance);
AttendanceRoutes.get("/attendance/employee", getEmployeeAttendance);
export default AttendanceRoutes;