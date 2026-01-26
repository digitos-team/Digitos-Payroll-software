import mongoose from "mongoose";

const LeaveBalanceSchema = new mongoose.Schema(
    {
        CompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        UserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        Month: {
            type: String,
            required: true,
            // "YYYY-MM"
        },
        TotalAllocated: {
            type: Number,
            default: 0,
        },
        Used: {
            type: Number,
            default: 0,
        },
        Remaining: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

LeaveBalanceSchema.index({ CompanyId: 1, UserId: 1, Month: 1 }, { unique: true });

export const LeaveBalance = mongoose.model("LeaveBalance", LeaveBalanceSchema);
