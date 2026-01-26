import mongoose from "mongoose";

const SalaryConfigurationRequestSchema = new mongoose.Schema(
    {
        CompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        EmployeeID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        RequestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        EffectFrom: {
            type: Date,
            default: Date.now,
        },
        SalaryHeads: [
            {
                SalaryHeadId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "SalaryHeads",
                    required: true,
                },
                applicableValue: {
                    type: Number,
                },
                percentage: {
                    type: Number,
                },
            },
        ],
        isTaxApplicable: {
            type: Boolean,
            default: false,
        },
        Status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },
        RejectionReason: {
            type: String
        },
        IsRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export const SalaryConfigurationRequest = mongoose.model("SalaryConfigurationRequest", SalaryConfigurationRequestSchema);
