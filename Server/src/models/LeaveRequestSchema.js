import mongoose from "mongoose";

const LeaveRequestSchema = new mongoose.Schema(
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
        LeaveType: {
            type: String,
            default: "General", // Or "Sick", "Casual" if we expand
        },
        FromDate: {
            type: Date,
            required: true,
        },
        ToDate: {
            type: Date,
            required: true,
        },
        Reason: {
            type: String,
        },
        Status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },
        ApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        RejectionReason: {
            type: String,
        },
    },
    { timestamps: true }
);

export const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);
