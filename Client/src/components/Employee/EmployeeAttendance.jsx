import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getEmployeeAttendance } from "../../utils/api/attendanceApi";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from "lucide-react";

const EmployeeAttendance = () => {
    const { user, companyId } = useSelector((state) => state.auth);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, absent: 0, halfDay: 0, leave: 0 });

    // Helper to format YYYY-MM
    const formatMonth = (date) => {
        return date.toISOString().slice(0, 7);
    };

    const fetchAttendance = async () => {
        if (!user || (!user.id && !user._id) || !companyId) return;

        setLoading(true);
        try {
            const actualCompanyId = companyId._id || companyId;
            const userId = user.id || user._id;
            const monthStr = formatMonth(currentDate);

            const res = await getEmployeeAttendance(actualCompanyId, userId, monthStr);

            if (res.success && res.data) {
                setAttendanceData(res.data);
                calculateStats(res.data);
            } else {
                setAttendanceData({});
                setStats({ present: 0, absent: 0, halfDay: 0, leave: 0 });
            }
        } catch (err) {
            console.error("Error fetching attendance:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        let present = 0, absent = 0, halfDay = 0, leave = 0;
        Object.values(data).forEach(status => {
            if (status === 'Present') present++;
            else if (status === 'Absent') absent++;
            else if (status === 'Half Day') halfDay++;
            else if (status === 'Leave' || status === 'Paid Leave' || status === 'Unpaid Leave') leave++;
        });
        setStats({ present, absent, halfDay, leave });
    };

    useEffect(() => {
        fetchAttendance();
    }, [currentDate, user, companyId]);

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    // Generate days for the current month
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => i + 1);
    };

    const days = getDaysInMonth();

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700 border-green-200';
            case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
            case 'Half Day': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Leave':
            case 'Paid Leave':
            case 'Unpaid Leave': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present': return <CheckCircle className="w-4 h-4" />;
            case 'Absent': return <XCircle className="w-4 h-4" />;
            case 'Half Day': return <Clock className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Attendance</h1>
                    <p className="text-gray-500 dark:text-gray-400">View your monthly attendance records</p>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        ←
                    </button>
                    <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 min-w-[140px] justify-center">
                        <CalendarIcon className="w-5 h-5 text-indigo-500" />
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Present</div>
                    <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Absent</div>
                    <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Half Day</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.halfDay}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Leaves</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.leave}</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Daily Log</h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading attendance...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
                        {days.map(day => {
                            const status = attendanceData[day];
                            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // Sun or Sat

                            return (
                                <div
                                    key={day}
                                    className={`
                                relative p-4 rounded-xl border transition-all duration-200
                                ${status
                                            ? getStatusColor(status)
                                            : isWeekend
                                                ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                        }
                            `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xl font-bold ${status ? '' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                                        <span className="text-xs uppercase font-medium opacity-60">
                                            {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-medium min-h-[24px]">
                                        {status ? (
                                            <>
                                                {getStatusIcon(status)}
                                                <span>{status}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeAttendance;
