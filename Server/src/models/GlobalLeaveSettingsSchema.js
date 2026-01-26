import mongoose from "mongoose";

const GlobalLeaveSettingsSchema = new mongoose.Schema(
    {
        CompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            unique: true,
        },
        DefaultMonthlyPaidLeaves: {
            type: Number,
            default: 1,
            required: true,
        },
        // Future extensibility: CarryForward, etc.
    },
    { timestamps: true }
);

export const GlobalLeaveSettings = mongoose.model("GlobalLeaveSettings", GlobalLeaveSettingsSchema);
