// src/utils/api/attendanceApi.js
import axiosInstance from "../axiosInstance";

// Mark Attendance (Bulk)
export const markAttendance = async (data) => {
    try {
        // data: { CompanyId, Date, Employees: [{UserId, Status}], MarkedBy }
        const res = await axiosInstance.post("/attendance/mark", data);
        return res.data;
    } catch (err) {
        console.error("Error marking attendance:", err);
        throw err.response?.data || err;
    }
};

// Get Monthly Attendance Report (Grid for all employees)
export const getMonthlyAttendance = async (CompanyId, Month) => {
    try {
        const res = await axiosInstance.get("/attendance/report", {
            params: { CompanyId, Month }
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching monthly attendance:", err);
        throw err.response?.data || err;
    }
};

// Get Attendance for a Specific Employee
export const getEmployeeAttendance = async (CompanyId, UserId, Month) => {
    try {
        const res = await axiosInstance.get("/attendance/employee", {
            params: { CompanyId, UserId, Month }
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching employee attendance:", err);
        throw err.response?.data || err;
    }
};
