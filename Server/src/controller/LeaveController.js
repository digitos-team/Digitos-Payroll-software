import { LeaveRequest } from "../models/LeaveRequestSchema.js";
import { LeaveBalance } from "../models/LeaveBalanceSchema.js";
import { GlobalLeaveSettings } from "../models/GlobalLeaveSettingsSchema.js";
import { Attendance } from "../models/AttendanceSchema.js";
import { Holiday } from "../models/HolidaySchema.js";
import { RecentActivity } from "../models/RecentActivitySchema.js";

const getOrInitBalance = async (CompanyId, UserId, Month) => {
    // Always fetch current settings
    const settings = await GlobalLeaveSettings.findOne({ CompanyId });
    const allocated = settings ? settings.DefaultMonthlyPaidLeaves : 1;

    let balance = await LeaveBalance.findOne({ CompanyId, UserId, Month });

    if (!balance) {
        balance = await LeaveBalance.create({
            CompanyId,
            UserId,
            Month,
            TotalAllocated: allocated,
            Used: 0,
            Remaining: allocated,
        });
    } else if (balance.TotalAllocated !== allocated) {
        // Sync with updated settings
        const oldAllocated = balance.TotalAllocated;
        balance.TotalAllocated = allocated;
        balance.Remaining = Math.max(0, balance.Remaining + (allocated - oldAllocated));
        await balance.save();
    }

    return balance;
};

// Apply for Leave
export const applyLeave = async (req, res) => {
    try {
        const { CompanyId, UserId, FromDate, ToDate, Reason, LeaveType } = req.body;

        const newLeave = await LeaveRequest.create({
            CompanyId,
            UserId,
            FromDate,
            ToDate,
            Reason,
            LeaveType,
            Status: "Pending",
        });

        res.status(201).json({ success: true, data: newLeave });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Leaves (Admin View)
export const getAllLeaves = async (req, res) => {
    try {
        const { CompanyId } = req.query;
        const leaves = await LeaveRequest.find({ CompanyId })
            .populate("UserId", "Name")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


export const updateLeaveStatus = async (req, res) => {
    try {
        const { RequestId, Status, ApproverId } = req.body;

        const leave = await LeaveRequest.findById(RequestId);
        if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

        if (leave.Status !== "Pending") {
            return res.status(400).json({ success: false, message: "Leave already processed" });
        }

        leave.Status = Status;
        leave.ApprovedBy = ApproverId;
        await leave.save();

        if (Status === "Approved") {
            const start = new Date(leave.FromDate);
            const end = new Date(leave.ToDate);

            // Fetch all holidays for this company within the date range
            const holidays = await Holiday.find({
                CompanyId: leave.CompanyId,
                Date: { $gte: start, $lte: end }
            });

            // Create a Set of holiday dates for quick lookup (YYYY-MM-DD format)
            const holidayDates = new Set(
                holidays.map(h => new Date(h.Date).toISOString().split("T")[0])
            );

            // Fetch Global Settings Once
            const globalSettings = await GlobalLeaveSettings.findOne({ CompanyId: leave.CompanyId });
            const allocated = globalSettings ? globalSettings.DefaultMonthlyPaidLeaves : 1;

            // Prepare for batch operations
            const attendanceOps = [];

            // Track accessed balances to avoid repeated DB calls
            // key: "YYYY-MM", value: LeaveBalance Document
            const balanceCache = new Map();

            // Helper to get balance from cache or DB
            const getCachedBalance = async (monthStr) => {
                if (balanceCache.has(monthStr)) return balanceCache.get(monthStr);

                let balance = await LeaveBalance.findOne({
                    CompanyId: leave.CompanyId,
                    UserId: leave.UserId,
                    Month: monthStr
                });

                if (!balance) {
                    balance = new LeaveBalance({
                        CompanyId: leave.CompanyId,
                        UserId: leave.UserId,
                        Month: monthStr,
                        TotalAllocated: allocated,
                        Used: 0,
                        Remaining: allocated,
                    });
                } else if (balance.TotalAllocated !== allocated) {
                    // Sync if needed (logic from getOrInitBalance)
                    const oldAllocated = balance.TotalAllocated;
                    balance.TotalAllocated = allocated;
                    balance.Remaining = Math.max(0, balance.Remaining + (allocated - oldAllocated));
                }

                balanceCache.set(monthStr, balance);
                return balance;
            };

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
                const monthStr = dateStr.slice(0, 7); // YYYY-MM
                const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

                // Skip Sundays (day 0)
                if (dayOfWeek === 0) {
                    continue;
                }

                // Skip Holidays
                if (holidayDates.has(dateStr)) {
                    continue;
                }

                // Process only working days
                const balance = await getCachedBalance(monthStr);

                let finalStatus = "UnpaidLeave";

                if (balance.Remaining > 0) {
                    finalStatus = "PaidLeave";
                    balance.Remaining -= 1;
                }

                balance.Used += 1;
                // We don't save here, we save after loop

                // Mark Attendance Operation
                attendanceOps.push({
                    updateOne: {
                        filter: { CompanyId: leave.CompanyId, UserId: leave.UserId, Date: dateStr },
                        update: { $set: { Status: finalStatus, MarkedBy: ApproverId } },
                        upsert: true
                    }
                });
            }

            // Execute Batch Updates
            if (attendanceOps.length > 0) {
                await Attendance.bulkWrite(attendanceOps);
            }

            // Save all modified balances
            for (const balance of balanceCache.values()) {
                await balance.save();
            }
        }

        // [LOG ACTIVITY]
        // Populate user name for the log
        await leave.populate("UserId", "Name");
        await RecentActivity.create({
            CompanyId: leave.CompanyId,
            userId: ApproverId,
            action: `${Status} Leave`, // "Approved Leave" or "Rejected Leave"
            target: leave.UserId?.Name ? `Employee ${leave.UserId.Name}` : "Employee",
        });

        res.status(200).json({ success: true, message: `Leave ${Status}` });
    } catch (error) {
        console.error("updateLeaveStatus error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// // Get Leave Balance for an Employee
// export const getLeaveBalance = async (req, res) => {
//     try {
//         const { CompanyId, UserId, Month } = req.query;
//         if (!CompanyId || !UserId || !Month) {
//             return res.status(400).json({ success: false, message: "CompanyId, UserId, and Month required" });
//         }

//         let balance = await LeaveBalance.findOne({ CompanyId, UserId, Month });

//         // If not found, initialize it from GlobalLeaveSettings
//         if (!balance) {
//             const settings = await GlobalLeaveSettings.findOne({ CompanyId });
//             const allocated = settings ? settings.DefaultMonthlyPaidLeaves : 1;

//             balance = await LeaveBalance.create({
//                 CompanyId,
//                 UserId,
//                 Month,
//                 TotalAllocated: allocated,
//                 Used: 0,
//                 Remaining: allocated,
//             });
//         }

//         res.status(200).json({ success: true, data: balance });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };
// Get Leave Balance for an Employee
export const getLeaveBalance = async (req, res) => {
    try {
        const { CompanyId, UserId, Month } = req.query;
        if (!CompanyId || !UserId || !Month) {
            return res.status(400).json({ success: false, message: "CompanyId, UserId, and Month required" });
        }

        // Always fetch the current setting from GlobalLeaveSettings
        const settings = await GlobalLeaveSettings.findOne({ CompanyId });
        const allocated = settings ? settings.DefaultMonthlyPaidLeaves : 1;

        let balance = await LeaveBalance.findOne({ CompanyId, UserId, Month });

        if (!balance) {
            // If not found, create a new balance record
            balance = await LeaveBalance.create({
                CompanyId,
                UserId,
                Month,
                TotalAllocated: allocated,
                Used: 0,
                Remaining: allocated,
            });
        } else if (balance.TotalAllocated !== allocated) {
            // If settings have changed, update the balance record
            balance.TotalAllocated = allocated;
            balance.Remaining = allocated - balance.Used;

            // Handle extra leaves scenario (used more than allocated)
            if (balance.Remaining < 0) {
                balance.ExtraLeaves = Math.abs(balance.Remaining);
                balance.Remaining = 0;
            } else {
                balance.ExtraLeaves = 0;
            }

            await balance.save();
        }

        // Also add ExtraLeaves field to response if not already present
        const responseData = {
            ...balance.toObject(),
            ExtraLeaves: balance.Used > allocated ? balance.Used - allocated : 0
        };

        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get Leaves by Employee (Employee View / Admin Filter)
export const getLeavesByEmployeeId = async (req, res) => {
    try {
        const { CompanyId, UserId } = req.body;

        if (!UserId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required"
            });
        }

        const filter = { UserId };

        // Optional but recommended to avoid cross-company data leaks
        if (CompanyId) {
            filter.CompanyId = CompanyId;
        }

        const leaves = await LeaveRequest.find(filter)
            .populate("ApprovedBy", "Name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
