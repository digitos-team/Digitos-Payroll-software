import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    Bell, Check, XCircle, Loader, Calendar, User,
    Clock, CheckCircle, Filter, RefreshCw
} from 'lucide-react';
import { getSalarySlipRequests, approveRequest, rejectRequest } from '../../../utils/api/salaryRequestApi';

const SalaryRequests = () => {
    const { companyId } = useSelector((state) => state.auth);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const companyIdValue = companyId?._id || companyId?.id || companyId;
            const response = await getSalarySlipRequests(companyIdValue, statusFilter);
            setRequests(response.data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchRequests();
        }
    }, [companyId, statusFilter]);

    const handleApprove = async (requestId) => {
        try {
            setProcessingId(requestId);
            await approveRequest(requestId);
            // Refresh the list
            fetchRequests();
        } catch (err) {
            console.error('Error approving request:', err);
            setError('Failed to approve request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId) => {
        try {
            setProcessingId(requestId);
            await rejectRequest(requestId);
            // Refresh the list
            fetchRequests();
        } catch (err) {
            console.error('Error rejecting request:', err);
            setError('Failed to reject request');
        } finally {
            setProcessingId(null);
        }
    };

    const formatMonth = (monthStr) => {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            approved: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200'
        };

        const icons = {
            pending: Clock,
            approved: CheckCircle,
            rejected: XCircle
        };

        const Icon = icons[status] || Clock;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
                <Icon className="w-3 h-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Bell className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Salary Slip Requests</h1>
                            <p className="text-sm text-gray-500">Manage employee salary slip download requests</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                            <div className="flex gap-2">
                                {['pending', 'approved', 'rejected'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={fetchRequests}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-lg font-medium">No {statusFilter} requests</p>
                            <p className="text-sm mt-1">There are no salary slip requests with this status</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Month
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Requested On
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        {statusFilter === 'pending' && (
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <motion.tr
                                            key={request._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {request.EmployeeID?.Name || 'Unknown Employee'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {request.EmployeeID?.Email || 'No email'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{formatMonth(request.Month)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {formatDate(request.requestedAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            {statusFilter === 'pending' && (
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(request._id)}
                                                            disabled={processingId === request._id}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {processingId === request._id ? (
                                                                <Loader className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request._id)}
                                                            disabled={processingId === request._id}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {processingId === request._id ? (
                                                                <Loader className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4" />
                                                            )}
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {!loading && requests.length > 0 && (
                    <div className="mt-4 text-sm text-gray-500 text-center">
                        Showing {requests.length} {statusFilter} request{requests.length !== 1 ? 's' : ''}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SalaryRequests;
