import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiCalendar, FiSend, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";
import { applyLeave, getLeaveBalance, getUserLeaves } from "../../utils/api/leaveApi";
import { getHolidays } from "../../utils/api/holidayApi";

const Leaves = () => {
    const { companyId, user } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;
    const userId = user?._id || user?.id;

    const [balance, setBalance] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        FromDate: "",
        ToDate: "",
        LeaveType: "General",
        Reason: ""
    });

    const currentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    };

    const loadData = async () => {
        if (!actualCompanyId || !userId) {
            console.log("❌ Leaves: Missing ID", { actualCompanyId, userId });
            return;
        }
        console.log("🚀 Leaves: Loading data for", { actualCompanyId, userId });
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getLeaveBalance(actualCompanyId, userId, currentMonth()),
                getUserLeaves(actualCompanyId, userId),
                getHolidays(actualCompanyId)
            ]);

            const [balanceResult, leavesResult, holidaysResult] = results;

            console.log("📊 Leaves: API Results", { balanceResult, leavesResult, holidaysResult });

            if (balanceResult.status === 'fulfilled' && balanceResult.value.success) {
                setBalance(balanceResult.value.data);
            } else {
                console.error("❌ Failed to load leave balance:", balanceResult.reason);
            }

            if (leavesResult.status === 'fulfilled' && leavesResult.value && (leavesResult.value.success || Array.isArray(leavesResult.value))) {
                console.log("✅ Leaves: Setting leaves state", leavesResult.value.data || leavesResult.value);
                setLeaves(leavesResult.value.data || leavesResult.value || []);
            } else {
                console.error("❌ Failed to load user leaves:", leavesResult.reason);
            }

            if (holidaysResult.status === 'fulfilled' && holidaysResult.value.success) {
                setHolidays(holidaysResult.value.data || []);
            } else {
                console.error("❌ Failed to load holidays:", holidaysResult.reason);
            }
        } catch (err) {
            console.error("❌ Leaves: Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [actualCompanyId, userId]);

    // Check if selected dates overlap with existing approved/pending leaves
    const checkOverlappingLeaves = (fromDate, toDate) => {
        if (!fromDate || !toDate) return null;

        const from = new Date(fromDate);
        const to = new Date(toDate);

        // Find overlapping approved or pending leaves
        const overlapping = leaves.filter(leave => {
            if (leave.Status === "Rejected") return false;

            const leaveFrom = new Date(leave.FromDate);
            const leaveTo = new Date(leave.ToDate);

            // Check if date ranges overlap
            return (from <= leaveTo && to >= leaveFrom);
        });

        return overlapping.length > 0 ? overlapping : null;
    };

    // Get date validation error
    const getDateError = () => {
        if (!formData.FromDate || !formData.ToDate) return null;

        const from = new Date(formData.FromDate);
        const to = new Date(formData.ToDate);

        if (from > to) {
            return "From date cannot be after To date";
        }

        const overlapping = checkOverlappingLeaves(formData.FromDate, formData.ToDate);
        if (overlapping) {
            const statuses = overlapping.map(l => l.Status).join("/");
            return `You already have ${statuses} leave(s) in the selected date range`;
        }

        return null;
    };

    const dateError = getDateError();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.FromDate || !formData.ToDate) {
            alert("Please select both From and To dates");
            return;
        }

        if (new Date(formData.FromDate) > new Date(formData.ToDate)) {
            alert("From date cannot be after To date");
            return;
        }

        // Check for overlapping leaves
        const overlapping = checkOverlappingLeaves(formData.FromDate, formData.ToDate);
        if (overlapping) {
            alert("You already have approved or pending leaves in the selected date range. Please choose different dates.");
            return;
        }

        setSubmitting(true);
        try {
            await applyLeave({
                CompanyId: actualCompanyId,
                UserId: userId,
                FromDate: formData.FromDate,
                ToDate: formData.ToDate,
                LeaveType: formData.LeaveType,
                Reason: formData.Reason
            });

            setFormData({ FromDate: "", ToDate: "", LeaveType: "General", Reason: "" });
            setShowForm(false);
            await loadData();
            alert("Leave request submitted successfully!");
        } catch (err) {
            alert(err.message || "Failed to submit leave request");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    // Calculate working days (excluding Sundays and holidays)
    const calculateDays = (from, to) => {
        if (!from || !to) return 0;

        const fromDate = new Date(from);
        const toDate = new Date(to);

        // Create a Set of holiday dates for quick lookup
        const holidayDates = new Set(
            holidays.map(h => new Date(h.Date).toISOString().split("T")[0])
        );

        let count = 0;
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            const dayOfWeek = d.getDay(); // 0 = Sunday

            // Skip Sundays
            if (dayOfWeek === 0) continue;

            // Skip holidays
            if (holidayDates.has(dateStr)) continue;

            count++;
        }

        return count;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <FiClock className="w-3 h-3" />
                        Pending
                    </span>
                );
            case "Approved":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <FiCheckCircle className="w-3 h-3" />
                        Approved
                    </span>
                );
            case "Rejected":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <FiXCircle className="w-3 h-3" />
                        Rejected
                    </span>
                );
            default:
                return status;
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                        <FiCalendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Leaves</h2>
                        <p className="text-sm text-gray-500">Apply for leaves and track requests</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                    <FiSend className="w-5 h-5" />
                    Apply for Leave
                </button>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            ) : (
                <>
                    {/* Leave Balance Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold opacity-90">
                                    {monthNames[now.getMonth()]} {now.getFullYear()}
                                </h3>
                                <FiCalendar className="w-5 h-5 opacity-70" />
                            </div>
                            <div className={`grid gap-4 text-center ${(balance?.Used || 0) > (balance?.TotalAllocated || 0) ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                <div>
                                    <p className="text-3xl font-bold">{balance?.TotalAllocated || 0}</p>
                                    <p className="text-xs opacity-80 mt-1">Total</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{balance?.Used || 0}</p>
                                    <p className="text-xs opacity-80 mt-1">Used</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{balance?.Remaining || 0}</p>
                                    <p className="text-xs opacity-80 mt-1">Remaining</p>
                                </div>
                                {(balance?.Used || 0) > (balance?.TotalAllocated || 0) && (
                                    <div className="bg-white/20 rounded-xl p-2">
                                        <p className="text-3xl font-bold text-red-200">
                                            {(balance?.Used || 0) - (balance?.TotalAllocated || 0)}
                                        </p>
                                        <p className="text-xs opacity-80 mt-1">Extra (Unpaid)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <FiClock className="w-5 h-5 text-amber-600" />
                                </div>
                                <span className="text-gray-500 text-sm">Pending Requests</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                                {leaves.filter(l => l.Status === "Pending").length}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-gray-500 text-sm">Approved This Month</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                                {leaves.filter(l => l.Status === "Approved").length}
                            </p>
                        </div>
                    </div>

                    {/* Apply Leave Form */}
                    {showForm && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Apply for Leave</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.FromDate}
                                            onChange={(e) => setFormData({ ...formData, FromDate: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.ToDate}
                                            onChange={(e) => setFormData({ ...formData, ToDate: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Leave Type
                                    </label>
                                    <select
                                        value={formData.LeaveType}
                                        onChange={(e) => setFormData({ ...formData, LeaveType: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    >
                                        <option value="General">General</option>
                                        <option value="Sick">Sick Leave</option>
                                        <option value="Casual">Casual Leave</option>
                                        <option value="Emergency">Emergency</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason
                                    </label>
                                    <textarea
                                        value={formData.Reason}
                                        onChange={(e) => setFormData({ ...formData, Reason: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Briefly describe the reason for your leave..."
                                    />
                                </div>

                                {/* Error Message */}
                                {dateError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <FiXCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <span className="text-sm text-red-600 font-medium">
                                            {dateError}
                                        </span>
                                    </div>
                                )}

                                {/* Day Count Info - Only show if no error */}
                                {formData.FromDate && formData.ToDate && !dateError && (
                                    <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
                                        <FiAlertCircle className="w-4 h-4 text-violet-600" />
                                        <span className="text-sm text-violet-700">
                                            You are requesting {calculateDays(formData.FromDate, formData.ToDate)} day(s) of leave
                                        </span>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || dateError}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FiSend className="w-4 h-4" />
                                                Submit Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Leave History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">My Leave Requests</h3>
                        </div>

                        {leaves.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <FiCalendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium">No leave requests yet</p>
                                <p className="text-sm">Click "Apply for Leave" to submit your first request</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leaves.map((leave) => (
                                        <tr key={leave._id} className="hover:bg-gray-50/50">
                                            <td className="py-4 px-6">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-800">
                                                        {formatDate(leave.FromDate)} - {formatDate(leave.ToDate)}
                                                    </div>
                                                    <div className="text-gray-500">
                                                        {calculateDays(leave.FromDate, leave.ToDate)} day(s)
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {leave.LeaveType || "General"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-600 text-sm max-w-xs truncate block" title={leave.Reason}>
                                                    {leave.Reason || "-"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {getStatusBadge(leave.Status)}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {formatDate(leave.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Leaves;
