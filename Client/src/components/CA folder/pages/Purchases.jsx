import React, { useEffect, useState } from "react";
import CALayout from "../layouts/CALayout";
import Loader from "../Loader/Loader";
import { getPurchases, getMonthlyPurchases, getMonthPurchases } from "../../../utils/CA api/CaApi";
import { AlertCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";

export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [monthPurchases, setMonthPurchases] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expandedPurchase, setExpandedPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load purchases (critical)
            const allPurchases = await getPurchases();
            setPurchases(allPurchases);

            // Try to load monthly stats (optional)
            try {
                const monthlyStats = await getMonthlyPurchases(selectedYear);
                setMonthlyData(monthlyStats.data || []);
            } catch (monthlyErr) {
                console.warn("Monthly purchases stats not available:", monthlyErr.message);
                setMonthlyData([]);
            }
        } catch (err) {
            console.error("Error loading purchases:", err);
            setError(err.message || "Failed to load purchases");
        } finally {
            setLoading(false);
        }
    };

    const handleMonthClick = async (monthNumber) => {
        try {
            setSelectedMonth(monthNumber);
            const data = await getMonthPurchases(monthNumber, selectedYear);
            setMonthPurchases(data || []);
        } catch (err) {
            console.error("Error loading month purchases:", err);
        }
    };

    const toggleExpand = (purchaseId) => {
        setExpandedPurchase(expandedPurchase === purchaseId ? null : purchaseId);
    };

    if (loading) return <Loader />;

    if (error) {
        return (
            <CALayout deadlines={[]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Purchases</h2>
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
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Purchases Management</h1>
                </div>

                {/* Monthly Summary Cards */}
                {monthlyData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Monthly Overview - {selectedYear}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    ₹{monthlyData.reduce((sum, m) => sum + (m.totalRevenue ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl">
                                <p className="text-sm text-gray-600">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₹{monthlyData.reduce((sum, m) => sum + (m.totalExpenses ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl">
                                <p className="text-sm text-gray-600">Total Profit</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{monthlyData.reduce((sum, m) => sum + (m.totalProfit ?? 0), 0).toLocaleString()}
                                </p>
                            </div>
                            {/* <div className="bg-purple-50 p-4 rounded-xl">
  <p className="text-sm text-gray-600">Profit Margin</p>
  <p className="text-2xl font-bold text-purple-600">
    {(
      monthlyData.reduce((sum, m) => sum + (m.profitMargin ?? 0), 0) / (monthlyData.length || 1)
    ).toFixed(2)}%
  </p>
</div> */}

                        </div>
                        {/* Month Buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                            {monthlyData.map((item) => (
                                <button
                                    key={item.monthNumber}
                                    onClick={() => handleMonthClick(item.monthNumber)}
                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${selectedMonth === item.monthNumber ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <p className="font-semibold text-gray-800">{item.month}</p>
                                    </div>
                                    {/* <p className="text-sm text-gray-600">Purchases: {item.totalPurchases}</p>
                                    <p className="text-sm text-green-600">Profit: ₹{item.profit ? item.profit.toLocaleString() : "0"}</p> */}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Purchases for selected month */}
                {selectedMonth && monthPurchases.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Purchases for {selectedMonth}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {monthPurchases.map((purchase) => (
                                        <tr key={purchase._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{purchase.clientName}</td>
                                            <td className="px-6 py-4">{purchase.serviceTitle}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">₹{purchase.orderAmount?.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                    {purchase.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(purchase.paidDate || purchase.orderDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Purchases List */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">All Purchases</h2>
                    <div className="space-y-3">
                        {purchases.map((purchase) => (
                            <div key={purchase._id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div
                                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                                    onClick={() => toggleExpand(purchase._id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Client</p>
                                                <p className="font-semibold text-gray-900">{purchase.clientName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Service</p>
                                                <p className="font-medium text-gray-900">{purchase.serviceTitle}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Revenue</p>
                                                <p className="font-semibold text-green-600">₹{purchase.orderAmount?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Expenses</p>
                                                <p className="font-semibold text-red-600">₹{purchase.totalExpenses?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Profit</p>
                                                <p className="font-semibold text-purple-600">₹{purchase.profit?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div>
                                            {expandedPurchase === purchase._id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Expanded Expenses */}
                                {expandedPurchase === purchase._id && purchase.relatedExpenses?.length > 0 && (
                                    <div className="p-4 bg-white border-t border-gray-200">
                                        <h3 className="font-semibold text-gray-800 mb-3">Related Expenses</h3>
                                        <div className="space-y-2">
                                            {purchase.relatedExpenses.map((expense) => (
                                                <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{expense.title}</p>
                                                        <p className="text-sm text-gray-600">{expense.type} • {expense.paymentMethod}</p>
                                                        {expense.description && (
                                                            <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-red-600">₹{expense.amount?.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </CALayout>
    );
}
