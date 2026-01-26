// src/utils/api/leaveApi.js
import axiosInstance from "../axiosInstance";

// Apply for leave (Employee)
export const applyLeave = async (data) => {
    try {
        // data: { CompanyId, UserId, FromDate, ToDate, Reason, LeaveType }
        const res = await axiosInstance.post("/leave/apply", data);
        return res.data;
    } catch (err) {
        console.error("Error applying for leave:", err);
        throw err.response?.data || err;
    }
};

// Get all leave requests (HR/Admin view)
export const getAllLeaves = async (CompanyId) => {
    try {
        const res = await axiosInstance.get("/leave/list", {
            params: { CompanyId }
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching leave requests:", err);
        throw err.response?.data || err;
    }
};

// Get leave requests for a specific user
export const getUserLeaves = async (CompanyId, UserId) => {
    try {
        // User explicitly defined route as: LeaveRoutes.post("/leave/by-employee", ...)
        // Router is mounted at /leave.
        // Therefore, URL is /leave/leave/by-employee.
        const res = await axiosInstance.post("/leave/by-employee", {
            CompanyId, UserId
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching user leaves:", err);
        throw err.response?.data || err;
    }
};

// Approve/Reject leave request (HR)
export const updateLeaveStatus = async (data) => {
    try {
        // data: { RequestId, Status, ApproverId }
        const res = await axiosInstance.put("/leave/status", data);
        return res.data;
    } catch (err) {
        console.error("Error updating leave status:", err);
        throw err.response?.data || err;
    }
};

// Get leave balance for an employee
export const getLeaveBalance = async (CompanyId, UserId, Month) => {
    try {
        const res = await axiosInstance.get("/leave/balance", {
            params: { CompanyId, UserId, Month }
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching leave balance:", err);
        throw err.response?.data || err;
    }
};
