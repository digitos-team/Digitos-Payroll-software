import { ATTENDANCE_CONFIG } from "../config/attendanceConfig.js";

/**
 * Middleware to check if user has permission to mark/modify attendance
 * Only HR, Admin, and SuperAdmin roles can mark attendance
 */
export const canMarkAttendance = (req, res, next) => {
    try {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!ATTENDANCE_CONFIG.ALLOWED_ROLES.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only HR/Admin can mark attendance.",
                userRole: userRole,
                requiredRoles: ATTENDANCE_CONFIG.ALLOWED_ROLES,
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Authorization check failed",
            error: error.message,
        });
    }
};

/**
 * Middleware to check if user can view attendance reports
 * HR, Admin, SuperAdmin, and CA can view all reports
 * Employees can only view their own attendance
 */
export const canViewAttendance = (req, res, next) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?._id;

        if (!userRole || !userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // If user has report view role, allow access to all reports
        if (ATTENDANCE_CONFIG.REPORT_VIEW_ROLES.includes(userRole)) {
            return next();
        }

        // For employees, check if they're requesting their own data
        const requestedUserId = req.query.UserId || req.params.UserId;

        if (userRole === "Employee") {
            if (!requestedUserId) {
                return res.status(403).json({
                    success: false,
                    message: "Employees can only view their own attendance. Please specify UserId.",
                });
            }

            if (String(requestedUserId) !== String(userId)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only view your own attendance.",
                });
            }

            return next();
        }

        // If role is not recognized, deny access
        return res.status(403).json({
            success: false,
            message: "Access denied. Insufficient permissions.",
            userRole: userRole,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Authorization check failed",
            error: error.message,
        });
    }
};
