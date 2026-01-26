import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiCalendar, FiSave, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getMonthlyAttendance, markAttendance } from "../../../utils/api/attendanceApi";
import { getHolidays } from "../../../utils/api/holidayApi";

const STATUS_COLORS = {
    Present: "bg-emerald-500 text-white",
    PaidLeave: "bg-blue-500 text-white",
    UnpaidLeave: "bg-red-500 text-white",
    Unmarked: "bg-gray-200 text-gray-500"
};

const STATUS_LABELS = {
    Present: "P",
    PaidLeave: "PL",
    UnpaidLeave: "UL",
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

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const loadData = async () => {
        if (!actualCompanyId) return;
        setLoading(true);
        setChanges({});
        try {
            const [attRes, holRes] = await Promise.all([
                getMonthlyAttendance(actualCompanyId, monthStr),
                getHolidays(actualCompanyId, monthStr)
            ]);

            if (attRes.success) {
                setAttendanceData(attRes.data || []);
            }
            if (holRes.success) {
                setHolidays(holRes.data || []);
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
        if (changes[changeKey]) {
            return changes[changeKey];
        }
        return empData.Attendance?.[day] || null;
    };

    const cycleStatus = (empData, day) => {
        const statuses = ["Present", "PaidLeave", "UnpaidLeave", null];
        const currentStatus = getStatus(empData, day);
        const currentIndex = statuses.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statuses.length;

        const changeKey = `${empData.UserId}-${day}`;
        setChanges(prev => ({
            ...prev,
            [changeKey]: statuses[nextIndex]
        }));
    };

    const handleSave = async () => {
        if (Object.keys(changes).length === 0) return;

        setSaving(true);
        try {
            // Group changes by date
            const changesByDate = {};
            Object.entries(changes).forEach(([key, status]) => {
                if (status === null) return; // Skip cleared statuses
                const [empId, day] = key.split("-");
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                if (!changesByDate[dateStr]) {
                    changesByDate[dateStr] = [];
                }
                changesByDate[dateStr].push({ UserId: empId, Status: status });
            });

            // Save each date's changes
            for (const [dateStr, employees] of Object.entries(changesByDate)) {
                await markAttendance({
                    CompanyId: actualCompanyId,
                    Date: dateStr,
                    Employees: employees,
                    MarkedBy: userId
                });
            }

            setChanges({});
            await loadData();
            alert("Attendance saved successfully!");
        } catch (err) {
            alert(err.message || "Failed to save attendance");
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
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <FiCalendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
                        <p className="text-sm text-gray-500">Mark monthly attendance for employees</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${hasChanges && !saving
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <FiSave className="w-5 h-5" />
                            Save Changes {hasChanges && `(${Object.keys(changes).length})`}
                        </>
                    )}
                </button>
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
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">PL</div>
                    <span className="text-sm text-gray-600">Paid Leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white text-xs font-bold">UL</div>
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

                                            return (
                                                <td key={day} className="py-1 px-1 text-center">
                                                    <button
                                                        onClick={() => cycleStatus(emp, day)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mx-auto transition-all hover:scale-110 ${status
                                                                ? STATUS_COLORS[status]
                                                                : STATUS_COLORS.Unmarked
                                                            } ${hasChange ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
                                                        title={`Click to change: ${status || "Unmarked"}`}
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
                💡 Click on a cell to cycle through statuses: Present → Paid Leave → Unpaid Leave → Unmarked
            </div>
        </div>
    );
};

export default Attendance;
