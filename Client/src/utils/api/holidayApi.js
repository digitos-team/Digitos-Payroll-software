// src/utils/api/holidayApi.js
import axiosInstance from "../axiosInstance";

// Add a new holiday
export const addHoliday = async (data) => {
    try {
        // data: { CompanyId, Date, Name }
        const res = await axiosInstance.post("/holiday/add", data);
        return res.data;
    } catch (err) {
        console.error("Error adding holiday:", err);
        throw err.response?.data || err;
    }
};

// Get holidays list (optional month filter)
export const getHolidays = async (CompanyId, Month = null) => {
    try {
        const params = { CompanyId };
        if (Month) params.Month = Month;

        const res = await axiosInstance.get("/holiday/list", { params });
        return res.data;
    } catch (err) {
        console.error("Error fetching holidays:", err);
        throw err.response?.data || err;
    }
};

// Update a holiday
export const updateHoliday = async (data) => {
    try {
        // data: { HolidayId, Name?, Date? }
        const res = await axiosInstance.put("/holiday/update", data);
        return res.data;
    } catch (err) {
        console.error("Error updating holiday:", err);
        throw err.response?.data || err;
    }
};

// Delete a holiday
export const deleteHoliday = async (HolidayId) => {
    try {
        const res = await axiosInstance.delete(`/holiday/delete/${HolidayId}`);
        return res.data;
    } catch (err) {
        console.error("Error deleting holiday:", err);
        throw err.response?.data || err;
    }
};
