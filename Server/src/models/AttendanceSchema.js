import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
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
        Date: {
            type: String,
            required: true,
            // Format: "YYYY-MM-DD" mostly used
        },
        Status: {
            type: String,
            enum: ["Present", "Absent", "PaidLeave", "UnpaidLeave", "HalfDay"],
            required: true,
        },
        MarkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // HR who marked this
        },
    },
    { timestamps: true }
);

AttendanceSchema.index({ CompanyId: 1, UserId: 1, Date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", AttendanceSchema);
