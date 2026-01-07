import { GlobalLeaveSettings } from "../models/GlobalLeaveSettingsSchema.js";

// Update or Create settings
export const updateSettings = async (req, res) => {
    try {
        const { CompanyId, DefaultMonthlyPaidLeaves } = req.body;
        if (!CompanyId) return res.status(400).json({ success: false, message: "CompanyId required" });

        const settings = await GlobalLeaveSettings.findOneAndUpdate(
            { CompanyId },
            {
                $set: {
                    DefaultMonthlyPaidLeaves: Number(DefaultMonthlyPaidLeaves) || 0
                }
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get settings
export const getSettings = async (req, res) => {
    try {
        const { CompanyId } = req.params;
        const settings = await GlobalLeaveSettings.findOne({ CompanyId });
        // Return default if not found
        const data = settings || { CompanyId, DefaultMonthlyPaidLeaves: 1 };
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
