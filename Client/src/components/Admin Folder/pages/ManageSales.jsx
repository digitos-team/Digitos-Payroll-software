import React, { useEffect, useState } from "react";
import { getPurchases } from "../../../utils/api/purchaseapi";

const ManageSales = () => {
    const [purchaseList, setPurchaseList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const data = await getPurchases();

            setPurchaseList(data);
        } catch (err) {
            console.error("Error fetching sales:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-semibold">Manage Sales</h2>
                    <p className="text-sm text-gray-500">
                        View and manage all sales (Paid Orders + Expenses)
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading sales...</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="table-auto w-full border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 border text-left">Client Name</th>
                                <th className="p-3 border text-left">Service</th>
                                <th className="p-3 border text-right">Order Amount</th>
                                <th className="p-3 border text-right">Total Expense</th>
                                <th className="p-3 border text-right">Profit</th>
                                <th className="p-3 border text-center">Payment Status</th>
                                <th className="p-3 border text-center">Order Date</th>
                                <th className="p-3 border text-center">Expenses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseList.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-gray-500">
                                        No sales found
                                    </td>
                                </tr>
                            ) : (
                                purchaseList.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-3 border">{item.clientName}</td>
                                        <td className="p-3 border">{item.serviceTitle}</td>
                                        <td className="p-3 border text-right">
                                            ₹{item.orderAmount?.toLocaleString()}
                                        </td>
                                        <td className="p-3 border text-right">
                                            ₹{item.totalExpenses?.toLocaleString()}
                                        </td>
                                        <td
                                            className={`p-3 border text-right font-semibold ${item.profit >= 0 ? "text-green-600" : "text-red-600"
                                                }`}
                                        >
                                            ₹{item.profit?.toLocaleString()}
                                        </td>
                                        <td className="p-3 border text-center">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${item.paymentStatus === "Paid"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                {item.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-3 border text-center">
                                            {new Date(item.orderDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 border text-center">
                                            <span className="text-sm text-gray-600">
                                                {item.relatedExpenses?.length || 0} items
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageSales;
