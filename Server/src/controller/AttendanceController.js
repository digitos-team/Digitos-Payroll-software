import { Attendance } from "../models/AttendanceSchema.js";
import { User } from "../models/UserSchema.js";

// Mark Attendance (Single or Bulk)
export const markAttendance = async (req, res) => {
    try {
        const { CompanyId, Date: attDate, Employees, MarkedBy } = req.body;
        // Employees: [{ UserId, Status }]

        if (!CompanyId || !attDate || !Array.isArray(Employees)) {
            return res.status(400).json({ success: false, message: "Invalid payload" });
        }

        const operations = Employees.map((emp) => ({
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
        }));

        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        res.status(200).json({ success: true, message: "Attendance marked successfully" });
    } catch (error) {
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
