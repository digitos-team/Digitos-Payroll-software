import { Holiday } from "../models/HolidaySchema.js";

// Add a new holiday
export const addHoliday = async (req, res) => {
    try {
        const { CompanyId, Date: holidayDate, Name } = req.body;

        if (!CompanyId || !holidayDate || !Name) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        // Normalize date to YYYY-MM-DD string
        const dateStr = new Date(holidayDate).toISOString().split("T")[0];

        const newHoliday = await Holiday.create({
            CompanyId,
            Date: dateStr,
            Name,
            Type: "Paid",
        });

        res.status(201).json({ success: true, data: newHoliday });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Holiday already exists for this date" });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get holidays for a specific month
export const getHolidays = async (req, res) => {
    try {
        const { CompanyId, Month } = req.query; // Month format YYYY-MM
        if (!CompanyId) return res.status(400).json({ success: false, message: "CompanyId required" });

        let query = { CompanyId };

        if (Month) {
            query.Date = { $regex: `^${Month}` };
        }

        const holidays = await Holiday.find(query).sort({ Date: 1 });
        res.status(200).json({ success: true, data: holidays });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update a holiday
export const updateHoliday = async (req, res) => {
    try {
        const { HolidayId, Name, Date: holidayDate } = req.body;

        if (!HolidayId) {
            return res.status(400).json({ success: false, message: "HolidayId required" });
        }

        const updateData = {};
        if (Name) updateData.Name = Name;
        if (holidayDate) updateData.Date = new Date(holidayDate).toISOString().split("T")[0];

        const updated = await Holiday.findByIdAndUpdate(HolidayId, { $set: updateData }, { new: true });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Holiday not found" });
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete a holiday
export const deleteHoliday = async (req, res) => {
    try {
        const { HolidayId } = req.params;

        if (!HolidayId) {
            return res.status(400).json({ success: false, message: "HolidayId required" });
        }

        const deleted = await Holiday.findByIdAndDelete(HolidayId);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Holiday not found" });
        }

        res.status(200).json({ success: true, message: "Holiday deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
