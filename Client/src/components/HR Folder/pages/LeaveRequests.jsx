import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiFileText, FiCheck, FiX, FiFilter, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { getAllLeaves, updateLeaveStatus } from "../../../utils/api/leaveApi";

const LeaveRequests = () => {
    const { companyId, user } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;
    const approverId = user?._id || user?.id;

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("All");
    const [actionLoading, setActionLoading] = useState(null);

    const loadLeaves = async () => {
        if (!actualCompanyId) return;
        setLoading(true);
        try {
            const res = await getAllLeaves(actualCompanyId);
            if (res.success) {
                setLeaves(res.data || []);
            }
        } catch (err) {
            console.error("Error loading leave requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaves();
    }, [actualCompanyId]);

    const handleAction = async (requestId, status) => {
        setActionLoading(requestId);
        try {
            await updateLeaveStatus({
                RequestId: requestId,
                Status: status,
                ApproverId: approverId
            });
            await loadLeaves();
        } catch (err) {
            alert(err.message || `Failed to ${status.toLowerCase()} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLeaves = leaves.filter(leave => {
        if (filter === "All") return true;
        return leave.Status === filter;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const calculateDays = (from, to) => {
        if (!from || !to) return 0;
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const diff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        return diff;
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

    const pendingCount = leaves.filter(l => l.Status === "Pending").length;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg relative">
                        <FiFileText className="w-6 h-6 text-white" />
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Leave Requests</h2>
                        <p className="text-sm text-gray-500">Manage employee leave applications</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <FiFilter className="w-4 h-4 text-gray-400" />
                <div className="inline-flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                    {["All", "Pending", "Approved", "Rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                    ? status === "Pending"
                                        ? "bg-amber-500 text-white shadow-md"
                                        : status === "Approved"
                                            ? "bg-emerald-500 text-white shadow-md"
                                            : status === "Rejected"
                                                ? "bg-red-500 text-white shadow-md"
                                                : "bg-gray-800 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {status}
                            {status === "Pending" && pendingCount > 0 && (
                                <span className="ml-1.5 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leave Requests Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        Loading leave requests...
                    </div>
                ) : filteredLeaves.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No leave requests found</p>
                        <p className="text-sm">{filter !== "All" ? `No ${filter.toLowerCase()} requests` : "No requests yet"}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLeaves.map((leave) => (
                                <tr key={leave._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                                                {leave.UserId?.Name?.charAt(0) || "?"}
                                            </div>
                                            <span className="font-medium text-gray-800">
                                                {leave.UserId?.Name || "Unknown"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {leave.LeaveType || "General"}
                                        </span>
                                    </td>
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
                                        <span className="text-gray-600 text-sm max-w-xs truncate block" title={leave.Reason}>
                                            {leave.Reason || "-"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {getStatusBadge(leave.Status)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-end gap-2">
                                            {leave.Status === "Pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(leave._id, "Approved")}
                                                        disabled={actionLoading === leave._id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === leave._id ? (
                                                            <div className="animate-spin w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                                                        ) : (
                                                            <FiCheck className="w-4 h-4" />
                                                        )}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(leave._id, "Rejected")}
                                                        disabled={actionLoading === leave._id}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === leave._id ? (
                                                            <div className="animate-spin w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full"></div>
                                                        ) : (
                                                            <FiX className="w-4 h-4" />
                                                        )}
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {leave.Status !== "Pending" && (
                                                <span className="text-gray-400 text-sm">
                                                    {leave.Status === "Approved" ? "✓ Approved" : "✗ Rejected"}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <FiClock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{leaves.filter(l => l.Status === "Pending").length}</p>
                            <p className="text-sm text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{leaves.filter(l => l.Status === "Approved").length}</p>
                            <p className="text-sm text-gray-500">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FiXCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{leaves.filter(l => l.Status === "Rejected").length}</p>
                            <p className="text-sm text-gray-500">Rejected</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequests;
