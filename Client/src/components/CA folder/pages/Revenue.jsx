import React, { useEffect, useState } from "react";
import CALayout from "../layouts/CALayout";
import Loader from "../Loader/Loader";
import {
    getAllRevenue,
    getMonthlyRevenue,
    getMonthRevenue
} from "../../../utils/CA api/CaApi";
import {
    DollarSign,
    TrendingUp,
    Calendar,
    AlertCircle,
    FileText,
    Building
} from "lucide-react";

export default function Revenue() {
    const [revenues, setRevenues] = useState([]);
    const [monthlyData, setMonthlyData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [monthRevenues, setMonthRevenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [revenueData, monthlyStats] = await Promise.all([
                getAllRevenue(),
                getMonthlyRevenue(selectedYear),
            ]);
            setRevenues(revenueData);
            setMonthlyData(monthlyStats);
        } catch (err) {
            console.error("Error loading revenue:", err);
            setError(err.message || "Failed to load revenue");
        } finally {
            setLoading(false);
        }
    };

    const handleMonthClick = async (monthNumber) => {
        try {
            setSelectedMonth(monthNumber);
            const data = await getMonthRevenue(monthNumber, selectedYear);
            setMonthRevenues(data.revenues || []);
        } catch (err) {
            console.error("Error loading month revenue:", err);
        }
    };

    if (loading) return <Loader />;

    if (error) {
        return (
            <CALayout deadlines={[]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Revenue</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            </CALayout>
        );
    }

    const totalRevenue = revenues.reduce((sum, rev) => sum + (rev.Amount || 0), 0);

    return (
        <CALayout deadlines={[]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Revenue Management</h1>
                        <p className="text-gray-600 mt-1">Track all revenue streams and payments</p>
                    </div>
                    <div className="flex items-center gap-3">

                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-10 h-10 opacity-80" />
                            <p className="text-sm opacity-90">Total Revenue</p>
                        </div>
                        <p className="text-4xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                        <p className="text-sm opacity-80 mt-2">All time</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-10 h-10 opacity-80" />
                            <p className="text-sm opacity-90">Total Records</p>
                        </div>
                        <p className="text-4xl font-bold">{revenues.length}</p>
                        <p className="text-sm opacity-80 mt-2">Revenue entries</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-10 h-10 opacity-80" />
                            <p className="text-sm opacity-90">Yearly Total</p>
                        </div>
                        <p className="text-4xl font-bold">₹{(monthlyData?.grandTotal || 0).toLocaleString()}</p>
                        <p className="text-sm opacity-80 mt-2">{selectedYear}</p>
                    </div>
                </div>

                {/* Monthly Overview */}
                {monthlyData && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Monthly Overview - {selectedYear}
                        </h2>

                        {/* Monthly Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {monthlyData.data?.map((item) => (
                                <button
                                    key={item.month}
                                    onClick={() => handleMonthClick(item.month.split(' ')[0])}
                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${selectedMonth === item.month.split(' ')[0]
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 bg-white hover:border-green-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <p className="font-semibold text-gray-800">{item.month}</p>
                                    </div>
                                    <p className="text-sm text-gray-600">Records: {item.count}</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        ₹{item.totalRevenue.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Avg: ₹{Math.round(item.averageRevenue).toLocaleString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Month-specific Revenue */}
                {selectedMonth && monthRevenues.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Revenue for {selectedMonth}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {monthRevenues.map((revenue) => (
                                        <tr key={revenue._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(revenue.RevenueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {revenue.CompanyId?.CompanyName || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">
                                                    {revenue.OrderId?.ServiceTitle || "N/A"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="font-semibold text-green-600">₹{revenue.Amount?.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-900">{revenue.AddedBy?.Name || "N/A"}</p>
                                                <p className="text-xs text-gray-500">{revenue.AddedBy?.Email || ""}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Revenue Records */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">All Revenue Records</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {revenues.map((revenue) => (
                                    <tr key={revenue._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(revenue.RevenueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">
                                                    {revenue.CompanyId?.CompanyName || "N/A"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">
                                                {revenue.OrderId?.ServiceTitle || "Direct Revenue"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-green-600 text-lg">
                                                ₹{revenue.Amount?.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                {revenue.PaymentMethod || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-gray-900">{revenue.AddedBy?.Name || "N/A"}</p>
                                            <p className="text-xs text-gray-500">{revenue.AddedBy?.Email || ""}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-xs truncate">
                                                {revenue.Notes || "-"}
                                            </p>
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
