import { Attendance } from "../models/AttendanceSchema.js";
import { User } from "../models/UserSchema.js";
import { isDateLocked, isFutureDate } from "../config/attendanceConfig.js";

// Mark Attendance (Single or Bulk)
export const markAttendance = async (req, res) => {
    try {
        const { CompanyId, Date: attDate, Employees, MarkedBy } = req.body;
        // Employees: [{ UserId, Status }]

        // 1. Basic validation
        if (!CompanyId || !attDate || !Array.isArray(Employees)) {
            return res.status(400).json({ success: false, message: "Invalid payload" });
        }

        if (Employees.length === 0) {
            return res.status(400).json({ success: false, message: "Employees array cannot be empty" });
        }

        // 2. Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(attDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Expected YYYY-MM-DD"
            });
        }

        // 3. Check if date is locked (past date that cannot be modified)
        if (isDateLocked(attDate)) {
            return res.status(403).json({
                success: false,
                message: `Cannot modify attendance for ${attDate}. This date has passed and is now locked.`,
                code: "DATE_LOCKED"
            });
        }

        // 4. Check if date is too far in the future
        if (isFutureDate(attDate)) {
            return res.status(403).json({
                success: false,
                message: `Cannot mark attendance for future date ${attDate}.`,
                code: "FUTURE_DATE"
            });
        }

        // 5. Validate all UserIds exist and belong to the company
        const userIds = Employees.map(emp => emp.UserId);
        const validUsers = await User.find({
            _id: { $in: userIds },
            CompanyId: CompanyId
        }).select("_id");

        const validUserIds = new Set(validUsers.map(u => String(u._id)));
        const invalidUsers = userIds.filter(id => !validUserIds.has(String(id)));

        if (invalidUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some users do not exist or do not belong to this company",
                invalidUserIds: invalidUsers
            });
        }

        // 6. Validate all statuses are valid enum values (or Unmarked)
        const validStatuses = ["Present", "Absent", "PaidLeave", "UnpaidLeave", "HalfDay", "Unmarked"];
        const invalidStatuses = Employees.filter(emp => !validStatuses.includes(emp.Status));

        if (invalidStatuses.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid status values found",
                validStatuses: validStatuses,
                invalidEntries: invalidStatuses
            });
        }

        // 7. Prepare bulk operations
        const operations = Employees.map((emp) => {
            if (emp.Status === "Unmarked") {
                return {
                    deleteOne: {
                        filter: { CompanyId, UserId: emp.UserId, Date: attDate }
                    }
                };
            }
            return {
                updateOne: {
                    filter: { CompanyId, UserId: emp.UserId, Date: attDate },
                    update: {
                        $set: {
                            Status: emp.Status,
                            MarkedBy
                        }
                    },
                    upsert: true,
                },
            };
        });

        // 8. Execute bulk write
        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        res.status(200).json({
            success: true,
            message: "Attendance marked successfully",
            date: attDate,
            employeesUpdated: operations.length
        });
    } catch (error) {
        console.error("markAttendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Attendance Report (Grid for FE)
export const getMonthlyAttendance = async (req, res) => {
    try {
        const { CompanyId, Month } = req.query; // Month: YYYY-MM
        if (!CompanyId || !Month) return res.status(400).json({ success: false, message: "Missing params" });

        // Fetch all employees
        const employees = await User.find({ CompanyId, role: "Employee" }).select("Name _id JobTitle");

        // Fetch all attendance records for this month
        // We use string match since Date is stored as String in Schema "YYYY-MM-DD"
        // Regex: ^YYYY-MM
        const attendanceRecords = await Attendance.find({
            CompanyId,
            Date: { $regex: `^${Month}` }
        });

        // Format data: { [UserId]: { [Day]: Status } }
        const attendanceMap = {};
        attendanceRecords.forEach((rec) => {
            const uid = String(rec.UserId);
            const day = rec.Date.split("-")[2]; // Extract day part
            if (!attendanceMap[uid]) attendanceMap[uid] = {};
            attendanceMap[uid][Number(day)] = rec.Status;
        });

        // Build grid
        const report = employees.map((emp) => ({
            UserId: emp._id,
            Name: emp.Name,
            Attendance: attendanceMap[String(emp._id)] || {},
        }));

        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Monthly Attendance for a Specific Employee
export const getEmployeeAttendance = async (req, res) => {
    try {
        const { CompanyId, UserId, Month } = req.query;
        if (!CompanyId || !UserId || !Month) {
            return res.status(400).json({ success: false, message: "CompanyId, UserId, and Month required" });
        }

        const attendanceRecords = await Attendance.find({
            CompanyId,
            UserId,
            Date: { $regex: `^${Month}` },
        }).sort({ Date: 1 });

        // Format: { [day]: Status }
        const attendanceMap = {};
        attendanceRecords.forEach((rec) => {
            const day = Number(rec.Date.split("-")[2]);
            attendanceMap[day] = rec.Status;
        });

        res.status(200).json({ success: true, data: attendanceMap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
