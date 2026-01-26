// src/utils/api/leaveSettingsApi.js
import axiosInstance from "../axiosInstance";

// Get global leave settings for a company
export const getLeaveSettings = async (CompanyId) => {
    try {
        const res = await axiosInstance.get(`/leaves/settings/${CompanyId}`);
        return res.data;
    } catch (err) {
        console.error("Error fetching leave settings:", err);
        throw err.response?.data || err;
    }
};

// Update global leave settings
export const updateLeaveSettings = async (data) => {
    try {
        // data: { CompanyId, DefaultMonthlyPaidLeaves }
        const res = await axiosInstance.post("/leaves/settings/update", data);
        return res.data;
    } catch (err) {
        console.error("Error updating leave settings:", err);
        throw err.response?.data || err;
    }
};
