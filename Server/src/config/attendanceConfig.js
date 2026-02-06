// Attendance system configuration
export const ATTENDANCE_CONFIG = {
    // Grace period in days after which attendance cannot be modified
    // Set to 3 to allow editing for up to 72 hours (3 days) after the date
    // This accommodates night shift employees and gives HR time to correct mistakes
    GRACE_PERIOD_DAYS: 3,

    // Maximum days in future that attendance can be marked
    // Set to 0 to prevent marking future attendance
    MAX_FUTURE_DAYS: 0,

    // Allowed roles for marking/modifying attendance
    ALLOWED_ROLES: ['HR', 'Admin'],

    // Roles that can view all attendance reports
    REPORT_VIEW_ROLES: ['HR', 'Admin'],
};

/**
 * Check if a date is locked for modification
 * @param {string} dateStr - Date string in format "YYYY-MM-DD"
 * @returns {boolean} - True if date is locked (cannot be modified)
 */
export const isDateLocked = (dateStr) => {
    const targetDate = new Date(dateStr);
    const today = new Date();

    // Set both dates to start of day for accurate comparison
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Calculate days difference
    const diffTime = today - targetDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If date is in the past beyond grace period, it's locked
    return diffDays > ATTENDANCE_CONFIG.GRACE_PERIOD_DAYS;
};

/**
 * Check if a date is too far in the future
 * @param {string} dateStr - Date string in format "YYYY-MM-DD"
 * @returns {boolean} - True if date is too far in future
 */
export const isFutureDate = (dateStr) => {
    const targetDate = new Date(dateStr);
    const today = new Date();

    // Set both dates to start of day for accurate comparison
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Calculate days difference
    const diffTime = targetDate - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If date is in the future beyond allowed days, reject it
    return diffDays > ATTENDANCE_CONFIG.MAX_FUTURE_DAYS;
};
