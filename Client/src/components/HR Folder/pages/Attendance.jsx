import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiCalendar, FiSave, FiChevronLeft, FiChevronRight, FiRotateCcw, FiRotateCw, FiCheckCircle } from "react-icons/fi";
import { getMonthlyAttendance, markAttendance } from "../../../utils/api/attendanceApi";
import { getHolidays } from "../../../utils/api/holidayApi";
import { getLeaveSettings } from "../../../utils/api/leaveSettingsApi";

const STATUS_COLORS = {
    Present: "bg-emerald-500 text-white",
    Absent: "bg-red-600 text-white",
    PaidLeave: "bg-blue-500 text-white",
    UnpaidLeave: "bg-orange-500 text-white",
    HalfDay: "bg-amber-500 text-white",
    Unmarked: "bg-gray-200 text-gray-500"
};

const STATUS_LABELS = {
    Present: "P",
    Absent: "A",
    PaidLeave: "PL",
    UnpaidLeave: "UL",
    HalfDay: "HD",
    Unmarked: "-"
};

const Attendance = () => {
    const { companyId, user } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;
    const userId = user?._id || user?.id;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changes, setChanges] = useState({});
    const [plLimit, setPlLimit] = useState(1); // Default limit 1

    // Undo/Redo functionality
    const [history, setHistory] = useState([{}]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const loadData = async () => {
        if (!actualCompanyId) return;
        setLoading(true);
        setChanges({});
        try {
            const [attRes, holRes, setRes] = await Promise.all([
                getMonthlyAttendance(actualCompanyId, monthStr),
                getHolidays(actualCompanyId, monthStr),
                getLeaveSettings(actualCompanyId)
            ]);

            if (attRes.success) {
                setAttendanceData(attRes.data || []);
            }
            if (holRes.success) {
                setHolidays(holRes.data || []);
            }
            if (setRes && setRes.DefaultMonthlyPaidLeaves !== undefined) {
                setPlLimit(setRes.DefaultMonthlyPaidLeaves);
            }
        } catch (err) {
            console.error("Error loading attendance data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [actualCompanyId, monthStr]);

    const getHolidayDates = () => {
        return new Set(holidays.map(h => {
            const day = parseInt(h.Date.split("-")[2]);
            return day;
        }));
    };

    const isSunday = (day) => {
        const date = new Date(year, month, day);
        return date.getDay() === 0;
    };

    const isHoliday = (day) => {
        return getHolidayDates().has(day);
    };

    const getStatus = (empData, day) => {
        const changeKey = `${empData.UserId}-${day}`;
        // Check if key exists in changes object (even if value is null)
        if (changeKey in changes) {
            return changes[changeKey];
        }
        return empData.Attendance?.[day] || null;
    };

    const isDateLocked = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const targetDate = new Date(dateStr);
        const today = new Date();

        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Calculate days difference
        const diffTime = today - targetDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Date is locked if it's more than 3 days in the past
        // Grace period: 3 days (72 hours) to accommodate night shifts
        return diffDays > 3;
    };

    // Helper: Count Paid Leaves for an employee in current view
    const countPaidLeaves = (empData) => {
        let count = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const status = getStatus(empData, d);
            if (status === "PaidLeave") count++;
        }
        return count;
    };

    const cycleStatus = (empData, day) => {
        // Check if date is locked
        if (isDateLocked(day)) {
            alert(`Cannot modify attendance for this date. You can only edit attendance for the last 3 days (72-hour grace period).`);
            return;
        }

        // More intuitive cycle: Present → Absent → HalfDay → PaidLeave → UnpaidLeave → Unmarked
        const statuses = ["Present", "Absent", "HalfDay", "PaidLeave", "UnpaidLeave", null];
        const currentStatus = getStatus(empData, day);
        const currentIndex = statuses.indexOf(currentStatus);

        // Calculate next status
        let nextStatus = statuses[(currentIndex + 1) % statuses.length];

        // CHECK LIMIT: If next status is "PaidLeave", checks if limit exceeded
        if (nextStatus === "PaidLeave") {
            const currentPLCount = countPaidLeaves(empData);
            // Note: If current day is ALREADY PaidLeave, we don't count it as "extra" if we are keeping it,
            // but here we are switching TO PaidLeave, so currently it is NOT PaidLeave.
            // So currentPLCount represents existing *other* Paid Leaves.
            // If already at limit, we cannot add one more.

            if (currentPLCount >= plLimit) {
                // Limit reached! Skip PaidLeave and go to next (UnpaidLeave)
                const plIndex = statuses.indexOf("PaidLeave");
                nextStatus = statuses[(plIndex + 1) % statuses.length];
                // alert(`Paid Leave limit (${plLimit}) reached. Skipping to Unpaid Leave.`);
            }
        }

        const changeKey = `${empData.UserId}-${day}`;
        const newChanges = {
            ...changes,
            [changeKey]: nextStatus
        };
        setChanges(newChanges);
        addToHistory(newChanges);
    };

    // Add to history for undo/redo
    const addToHistory = (newChanges) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ ...newChanges });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Undo function
    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setChanges({ ...history[newIndex] });
        }
    };

    // Redo function
    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setChanges({ ...history[newIndex] });
        }
    };

    // Mark All Present for today
    const markAllPresentToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentMonth = new Date(year, month, 1);
        currentMonth.setHours(0, 0, 0, 0);

        // Check if we're viewing current month
        if (today.getMonth() !== month || today.getFullYear() !== year) {
            alert("Mark All Present only works for the current month.");
            return;
        }

        const todayDay = today.getDate();

        if (isDateLocked(todayDay)) {
            alert("Cannot mark attendance for today as it's locked.");
            return;
        }

        const confirmed = window.confirm(`Mark all ${attendanceData.length} employees as Present for today (${year}-${String(month + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')})?`);

        if (!confirmed) return;

        const newChanges = { ...changes };
        attendanceData.forEach(emp => {
            const changeKey = `${emp.UserId}-${todayDay}`;
            newChanges[changeKey] = "Present";
        });

        setChanges(newChanges);
        addToHistory(newChanges);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [historyIndex, history]);

    const handleSave = async () => {
        if (Object.keys(changes).length === 0) return;

        // Validate no locked dates in changes
        const lockedChanges = Object.keys(changes).filter(key => {
            const day = parseInt(key.split("-")[1]);
            return isDateLocked(day);
        });

        if (lockedChanges.length > 0) {
            alert("Cannot save: Some changes are for dates older than 3 days. Only the last 3 days can be edited.");
            return;
        }

        setSaving(true);
        try {
            // Group changes by date
            const changesByDate = {};

            Object.entries(changes).forEach(([key, status]) => {
                const [empId, day] = key.split("-");
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                if (!changesByDate[dateStr]) {
                    changesByDate[dateStr] = [];
                }

                // If status is null, send "Unmarked" to notify backend to delete the record
                const finalStatus = status === null ? "Unmarked" : status;
                changesByDate[dateStr].push({ UserId: empId, Status: finalStatus });
            });

            // Save records (including "Unmarked" ones for deletion)
            for (const [dateStr, employees] of Object.entries(changesByDate)) {
                await markAttendance({
                    CompanyId: actualCompanyId,
                    Date: dateStr,
                    Employees: employees,
                    MarkedBy: userId
                });
            }

            // Clear changes and history
            setChanges({});
            setHistory([{}]);
            setHistoryIndex(0);

            // Reload to get fresh data from database
            await loadData();
            alert("Attendance saved successfully!");
        } catch (err) {
            console.error("Save error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to save attendance";
            alert(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const hasChanges = Object.keys(changes).length > 0;

    return (
        <div className="p-3 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <FiCalendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Mark monthly attendance for employees</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Mark All Present */}
                    <button
                        onClick={markAllPresentToday}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg text-sm"
                        title="Mark all employees as Present for today"
                    >
                        <FiCheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Mark All Present</span>
                        <span className="sm:hidden">All Present</span>
                    </button>

                    {/* Undo */}
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all text-sm ${historyIndex > 0
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <FiRotateCcw className="w-4 h-4" />
                        <span className="hidden md:inline">Undo</span>
                    </button>

                    {/* Redo */}
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all text-sm ${historyIndex < history.length - 1
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        title="Redo (Ctrl+Y)"
                    >
                        <FiRotateCw className="w-4 h-4" />
                        <span className="hidden md:inline">Redo</span>
                    </button>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm ${hasChanges && !saving
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                <span className="hidden sm:inline">Saving...</span>
                            </>
                        ) : (
                            <>
                                <FiSave className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Save Changes {hasChanges && `(${Object.keys(changes).length})`}</span>
                                <span className="sm:hidden">Save {hasChanges && `(${Object.keys(changes).length})`}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-800">
                    {monthNames[month]} {year}
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">P</div>
                    <span className="text-sm text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                    <span className="text-sm text-gray-600">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">PL</div>
                    <span className="text-sm text-gray-600">Paid Leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">UL</div>
                    <span className="text-sm text-gray-600">Unpaid Leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">-</div>
                    <span className="text-sm text-gray-600">Unmarked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-orange-600 text-xs font-bold">S</div>
                    <span className="text-sm text-gray-600">Sunday</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-purple-600 text-xs font-bold">H</div>
                    <span className="text-sm text-gray-600">Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold">HD</div>
                    <span className="text-sm text-gray-600">Half Day</span>
                </div>
            </div>

            {/* Attendance Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        Loading attendance data...
                    </div>
                ) : attendanceData.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiCalendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No employees found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-max">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                                        Employee
                                    </th>
                                    {days.map((day) => (
                                        <th
                                            key={day}
                                            className={`py-2 px-1 text-center text-xs font-semibold min-w-[36px] ${isSunday(day)
                                                ? "bg-orange-50 text-orange-600"
                                                : isHoliday(day)
                                                    ? "bg-purple-50 text-purple-600"
                                                    : "text-gray-500"
                                                }`}
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendanceData.map((emp) => (
                                    <tr key={emp.UserId} className="hover:bg-gray-50/50">
                                        <td className="py-2 px-4 sticky left-0 bg-white z-10 border-r border-gray-100">
                                            <span className="font-medium text-gray-800 text-sm">{emp.Name}</span>
                                        </td>
                                        {days.map((day) => {
                                            const status = getStatus(emp, day);
                                            const sunday = isSunday(day);
                                            const holiday = isHoliday(day);
                                            const changeKey = `${emp.UserId}-${day}`;
                                            const hasChange = changes.hasOwnProperty(changeKey);

                                            if (sunday) {
                                                return (
                                                    <td key={day} className="py-1 px-1 text-center bg-orange-50">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 text-xs font-bold mx-auto">
                                                            S
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (holiday) {
                                                return (
                                                    <td key={day} className="py-1 px-1 text-center bg-purple-50">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 text-xs font-bold mx-auto">
                                                            H
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            const isLocked = isDateLocked(day);

                                            return (
                                                <td key={day} className={`py-1 px-1 text-center ${isLocked ? "bg-gray-50" : ""}`}>
                                                    <button
                                                        onClick={() => cycleStatus(emp, day)}
                                                        disabled={isLocked}
                                                        className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold mx-auto transition-all ${isLocked ? "cursor-not-allowed opacity-50" : "hover:scale-110 cursor-pointer active:scale-95"} ${status
                                                            ? STATUS_COLORS[status]
                                                            : STATUS_COLORS.Unmarked
                                                            } ${hasChange ? "ring-2 ring-indigo-400 ring-offset-1" : ""} ${isLocked ? "border-2 border-gray-300" : ""}`}
                                                        title={isLocked ? "Locked - Older than 3 days" : `Click to change: ${status || "Unmarked"}`}
                                                    >
                                                        {status ? STATUS_LABELS[status] : STATUS_LABELS.Unmarked}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tip */}
            <div className="mt-4 text-sm text-gray-500 text-center">
                💡 Click on a cell to cycle: Absent → Present → Unpaid Leave → Paid Leave → Half Day → Unmarked
                <br />
                🔒 Dates older than 3 days are locked (72-hour grace period for night shifts)
            </div>
        </div>
    );
};

export default Attendance;
