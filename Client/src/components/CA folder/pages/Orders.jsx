import React, { useEffect, useState } from "react";
import CALayout from "../layouts/CALayout";
import Loader from "../Loader/Loader";
import {
    getOrders,
    getMonthlyOrders,
    getMonthOrders,
    exportOrderInvoice,
    exportFinalBill
} from "../../../utils/CA api/CaApi";
import {
    FileText,
    Download,
    Eye,
    Calendar,
    TrendingUp,
    DollarSign,
    CheckCircle,
    AlertCircle
} from "lucide-react";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [monthlyData, setMonthlyData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [monthOrders, setMonthOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadOrders();
        loadMonthlyOrders();
    }, [selectedYear]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getOrders();
            setOrders(data);
        } catch (err) {
            console.error("Error loading orders:", err);
            setError(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const loadMonthlyOrders = async () => {
        try {
            const data = await getMonthlyOrders(selectedYear);
            setMonthlyData(data);
        } catch (err) {
            console.error("Error loading monthly orders:", err);
        }
    };

    const handleMonthClick = async (monthNumber) => {
        try {
            setSelectedMonth(monthNumber);
            const data = await getMonthOrders(monthNumber, selectedYear);
            setMonthOrders(data.orders || []);
        } catch (err) {
            console.error("Error loading month orders:", err);
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const blob = await exportOrderInvoice(orderId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Order-Invoice-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Error downloading invoice:", err);
            alert("Failed to download invoice");
        }
    };

    const handleDownloadFinalBill = async (orderId) => {
        try {
            const blob = await exportFinalBill(orderId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Tax-Invoice-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Error downloading final bill:", err);
            alert(err.message || "Failed to download final bill. Order must be fully paid.");
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            Pending: "bg-yellow-100 text-yellow-800",
            Confirmed: "bg-blue-100 text-blue-800",
            Completed: "bg-green-100 text-green-800",
            Cancelled: "bg-red-100 text-red-800",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
                {status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const statusColors = {
            Paid: "bg-green-100 text-green-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Partial: "bg-orange-100 text-orange-800",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
                {status}
            </span>
        );
    };

    if (loading) return <Loader />;

    if (error) {
        return (
            <CALayout deadlines={[]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Orders</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            </CALayout>
        );
    }

    return (
        <CALayout deadlines={[]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
                        <p className="text-gray-600 mt-1">Track and manage all your orders</p>
                    </div>
                    <div className="flex items-center gap-3">

                    </div>
                </div>

                {/* Monthly Summary Cards */}
                {monthlyData && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Monthly Overview - {selectedYear}
                        </h2>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {monthlyData.summary?.totalOrdersInYear || 0}
                                        </p>
                                    </div>
                                    <FileText className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>

                            <div className="bg-green-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Value</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₹{(monthlyData.summary?.grandTotal || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-green-500" />
                                </div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Completed</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {monthlyData.summary?.totalCompletedOrders || 0}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>

                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Paid Orders</p>
                                        <p className="text-2xl font-bold text-indigo-600">
                                            {monthlyData.summary?.totalPaidOrders || 0}
                                        </p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-indigo-500" />
                                </div>
                            </div>
                        </div>

                        {/* Monthly Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {monthlyData.data?.map((item) => (
                                <button
                                    key={item.monthNumber}
                                    onClick={() => handleMonthClick(item.monthNumber)}
                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${selectedMonth === item.monthNumber
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white hover:border-blue-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <p className="font-semibold text-gray-800">{item.month}</p>
                                    </div>
                                    <p className="text-sm text-gray-600">Orders: {item.totalOrders}</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        ₹{item.totalOrderValue.toLocaleString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Month-specific Orders */}
                {selectedMonth && monthOrders.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Orders for {monthlyData.data?.find(m => m.monthNumber === selectedMonth)?.month}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {monthOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="font-medium text-gray-900">{order.ClientName}</p>
                                                    <p className="text-sm text-gray-500">{order.ClientEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{order.ServiceTitle}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="font-semibold text-gray-900">₹{order.Amount?.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(order.OrderStatus)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPaymentStatusBadge(order.PaymentStatus)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDownloadInvoice(order._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Download Proforma Invoice"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {order.PaymentStatus === "Paid" && (
                                                        <button
                                                            onClick={() => handleDownloadFinalBill(order._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="Download Tax Invoice"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Orders Table */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">All Orders</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Advance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.ClientName}</p>
                                                <p className="text-sm text-gray-500">{order.ClientEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{order.ServiceTitle}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-gray-900">₹{order.Amount?.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-green-600">₹{order.AdvancePaid?.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-orange-600">₹{order.BalanceDue?.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(order.OrderStatus)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getPaymentStatusBadge(order.PaymentStatus)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDownloadInvoice(order._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Download Proforma Invoice"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                {order.PaymentStatus === "Paid" && (
                                                    <button
                                                        onClick={() => handleDownloadFinalBill(order._id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Download Tax Invoice"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </CALayout>
    );
}
