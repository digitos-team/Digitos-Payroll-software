import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema(
    {
        CompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        Date: {
            type: String, // Changed to String "YYYY-MM-DD" for consistency with Attendance
            required: true,
        },
        Name: {
            type: String,
            required: true,
        },
        Type: {
            type: String,
            default: "Paid",
        },
    },
    { timestamps: true }
);

HolidaySchema.index({ CompanyId: 1, Date: 1 }, { unique: true });

export const Holiday = mongoose.model("Holiday", HolidaySchema);
