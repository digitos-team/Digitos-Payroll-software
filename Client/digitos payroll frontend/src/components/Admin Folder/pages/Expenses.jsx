import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";

import AddExpenseModal from "../components/Modals/AddExpenseModal";
import EditExpenseModal from "../components/Modals/EditExpenseModal";
import { addExpense, getAllExpenses, getExpensesByOrder, updateExpense, deleteExpense, getMonthExpenses, copyFixedExpenses } from "../../../utils/api/expenseapi";
import { getOrdersApi } from "../../../utils/api/orderapi";

// Base URL for accessing uploaded files (without /api)
const BASE_URL = "http://localhost:5000/";

const Expenses = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [expenseList, setExpenseList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Order filtering states
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [orderExpenses, setOrderExpenses] = useState([]);
    const [orderExpenseStats, setOrderExpenseStats] = useState({ totalExpense: 0, count: 0 });
    const [showOrderExpenses, setShowOrderExpenses] = useState(false);
    const [loadingOrderExpenses, setLoadingOrderExpenses] = useState(false);

    // Monthly filtering states
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState({ totalAmount: 0, count: 0, month: "" });
    const [showMonthlyExpenses, setShowMonthlyExpenses] = useState(false);
    const [loadingMonthlyExpenses, setLoadingMonthlyExpenses] = useState(false);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await getAllExpenses();
            console.log("Fetched expense data:", data);
            setExpenseList(data);
        } catch (err) {
            console.error("Error fetching expenses:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch orders on mount
    const fetchOrders = async () => {
        try {
            const data = await getOrdersApi();
            console.log("Fetched orders data:", data);
            console.log("Orders array:", Array.isArray(data) ? data : "Not an array");
            if (data && data.length > 0) {
                console.log("First order object:", data[0]);
                console.log("First order keys:", Object.keys(data[0]));
            }
            setOrders(data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchOrders();
    }, []);

    // Handle monthly filter
    const handleMonthlyFilter = async () => {
        if (!selectedMonth || !selectedYear) {
            alert("Please select both month and year");
            return;
        }

        setLoadingMonthlyExpenses(true);

        try {
            const data = await getMonthExpenses(selectedMonth, selectedYear);
            setMonthlyExpenses(data.expenses || []);
            setMonthlyStats({
                totalAmount: data.totalAmount || 0,
                count: data.count || 0,
                month: data.month || ""
            });
            setShowMonthlyExpenses(true);
        } catch (err) {
            console.error("Error fetching monthly expenses:", err);
            setMonthlyExpenses([]);
            setMonthlyStats({ totalAmount: 0, count: 0, month: "" });
        } finally {
            setLoadingMonthlyExpenses(false);
        }
    };

    // Clear monthly filter
    const handleClearMonthlyFilter = () => {
        setSelectedMonth("");
        setSelectedYear("");
        setShowMonthlyExpenses(false);
        setMonthlyExpenses([]);
        setMonthlyStats({ totalAmount: 0, count: 0, month: "" });
    };

    const handleCopyFixedExpenses = async () => {
        if (!selectedMonth || !selectedYear) return;

        if (!window.confirm(`Are you sure you want to copy fixed expenses from the previous month to ${selectedMonth}/${selectedYear}?`)) {
            return;
        }

        try {
            // We need companyId, assuming it's available in context or we can pass a dummy one if backend handles it from token
            // But backend expects CompanyId in body. 
            // Let's check how addExpense gets CompanyId. It gets it from getCompanyId() in api wrapper.
            // So we just need to pass targetMonth and targetYear.
            // Wait, the API wrapper for copyFixedExpenses takes 'data'.
            // We need to construct the data object.
            // The backend expects { CompanyId, targetMonth, targetYear }.
            // The API wrapper `copyFixedExpenses` calls `axios.post`.
            // We should let the API wrapper handle CompanyId if possible, but `addExpense` wrapper handles it.
            // Let's update `copyFixedExpenses` in `expenseapi.js` to inject CompanyId too?
            // Or we can just pass it here if we have it. 
            // `Expenses.jsx` doesn't seem to have `companyId` in state.
            // Let's update `expenseapi.js` to inject CompanyId like `addExpense` does.
            // For now, I'll assume `expenseapi.js` was updated or I will update it.
            // Actually, I updated `expenseapi.js` to just pass `data`. 
            // I should update `expenseapi.js` to inject CompanyId.
            // Let's do that in a separate step.

            // For now, let's call the API.
            const res = await copyFixedExpenses({
                targetMonth: selectedMonth,
                targetYear: selectedYear
            });

            alert(res.message);
            // Refresh monthly expenses
            handleMonthlyFilter();
        } catch (err) {
            console.error("Error copying fixed expenses:", err);
            alert("Failed to copy fixed expenses.");
        }
    };

    const handleAddExpense = async (data) => {
        try {
            const res = await addExpense(data);
            // Refresh the list after adding
            fetchExpenses();
            setOpenModal(false);
            alert("Expense added successfully!");
        } catch (err) {
            console.error("Error adding expense:", err);
            alert("Failed to add expense. Check console for details.");
        }
    };

    // Handle order selection and fetch expenses for that order
    const handleOrderSelect = async (orderId) => {
        if (!orderId) {
            setShowOrderExpenses(false);
            setSelectedOrderId("");
            return;
        }

        setSelectedOrderId(orderId);
        setLoadingOrderExpenses(true);

        try {
            const data = await getExpensesByOrder(orderId);
            setOrderExpenses(data.expenses || []);
            setOrderExpenseStats({
                totalExpense: data.totalExpense || 0,
                count: data.count || 0
            });
            setShowOrderExpenses(true);
        } catch (err) {
            console.error("Error fetching order expenses:", err);
            setOrderExpenses([]);
            setOrderExpenseStats({ totalExpense: 0, count: 0 });
        } finally {
            setLoadingOrderExpenses(false);
        }
    };

    // Clear order filter
    const handleClearFilter = () => {
        setSelectedOrderId("");
        setShowOrderExpenses(false);
        setOrderExpenses([]);
        setOrderExpenseStats({ totalExpense: 0, count: 0 });
    };

    // Handle edit expense
    const handleEditExpense = (expense) => {
        // Check if expense type is Salary
        if (expense.ExpenseType === "Salary") {
            alert("Salary expenses cannot be updated. This is a system-generated expense.");
            return;
        }
        setSelectedExpense(expense);
        setOpenEditModal(true);
    };

    // Handle update expense
    const handleUpdateExpense = async (expenseId, data) => {
        try {
            await updateExpense(expenseId, data);
            fetchExpenses();
            setOpenEditModal(false);
            setSelectedExpense(null);
            alert("Expense updated successfully!");
        } catch (err) {
            console.error("Error updating expense:", err);
            // Check if it's a 403 error (Salary expense restriction)
            if (err.response?.status === 403) {
                alert("Salary expenses cannot be updated.");
            } else {
                alert("Failed to update expense. Check console for details.");
            }
        }
    };

    // Handle delete expense
    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) {
            return;
        }

        try {
            await deleteExpense(expenseId);
            fetchExpenses();
            // Also refresh order expenses if showing
            if (showOrderExpenses && selectedOrderId) {
                handleOrderSelect(selectedOrderId);
            }
            // Refresh monthly expenses if showing
            if (showMonthlyExpenses && selectedMonth && selectedYear) {
                handleMonthlyFilter();
            }
            alert("Expense deleted successfully!");
        } catch (err) {
            console.error("Error deleting expense:", err);
            alert("Failed to delete expense. Check console for details.");
        }
    };

    // Group expenses by type for summary
    const expenseSummary = expenseList.reduce((acc, expense) => {
        const type = expense.ExpenseType || "Other";
        if (!acc[type]) {
            acc[type] = { count: 0, total: 0 };
        }
        acc[type].count += 1;
        acc[type].total += expense.Amount || 0;
        return acc;
    }, {});

    const totalExpenses = expenseList.reduce((sum, exp) => sum + (exp.Amount || 0), 0);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-semibold">Expense Management</h2>
                    <p className="text-sm text-gray-500">
                        Track and manage all company expenses
                    </p>
                </div>
                <Button variant="contained" color="error" onClick={() => setOpenModal(true)}>
                    Add Expense
                </Button>
            </div>

            {/* Order Filter Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Order:</label>
                    <select
                        value={selectedOrderId}
                        onChange={(e) => {
                            console.log("Selected order ID:", e.target.value);
                            handleOrderSelect(e.target.value);
                        }}
                        className="flex-1 max-w-md border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="">All Expenses</option>
                        {orders.map((order) => (
                            <option key={order._id} value={order._id}>
                                {order.ServiceTitle || "Untitled"} - {order.ClientName || "Unknown"}
                            </option>
                        ))}
                    </select>
                    {showOrderExpenses && (
                        <button
                            onClick={handleClearFilter}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {/* Monthly Filter Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Month:</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Year</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                    <button
                        onClick={handleMonthlyFilter}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                    >
                        Apply Filter
                    </button>
                    {showMonthlyExpenses && (
                        <>
                            <button
                                onClick={handleCopyFixedExpenses}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition"
                                title="Copy fixed expenses from previous month"
                            >
                                Copy Fixed Expenses
                            </button>
                            <button
                                onClick={handleClearMonthlyFilter}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition"
                            >
                                Clear Filter
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Monthly Expenses Section */}
            {showMonthlyExpenses && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Expenses for {monthlyStats.month}
                        </h3>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Total Expenses</p>
                                <p className="text-xl font-bold text-blue-600">₹{monthlyStats.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Count</p>
                                <p className="text-xl font-bold text-gray-800">{monthlyStats.count}</p>
                            </div>
                        </div>
                    </div>

                    {loadingMonthlyExpenses ? (
                        <div className="text-center py-8 text-gray-500">Loading monthly expenses...</div>
                    ) : monthlyExpenses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No expenses found for this month
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-auto w-full border">
                                <thead>
                                    <tr className="bg-blue-100">
                                        <th className="p-3 border text-left">Expense Title</th>
                                        <th className="p-3 border text-left">Type</th>
                                        <th className="p-3 border text-right">Amount</th>
                                        <th className="p-3 border text-center">Date</th>
                                        <th className="p-3 border text-center">Payment Method</th>
                                        <th className="p-3 border text-left">Description</th>
                                        <th className="p-3 border text-center">Receipt</th>
                                        <th className="p-3 border text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyExpenses.map((item) => (
                                        <tr key={item._id} className="hover:bg-blue-50 dark:hover:bg-blue-800">
                                            <td className="p-3 border font-medium">{item.ExpenseTitle}</td>
                                            <td className="p-3 border">
                                                <span className={`px-2 py-1 rounded text-xs ${item.ExpenseType === 'Salary' ? 'bg-blue-100 text-blue-800' :
                                                    item.ExpenseType === 'Operational' ? 'bg-green-100 text-green-800' :
                                                        item.ExpenseType === 'Utilities' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.ExpenseType}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-right font-semibold text-red-600">
                                                ₹{item.Amount?.toLocaleString()}
                                            </td>
                                            <td className="p-3 border text-center">
                                                {new Date(item.ExpenseDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 border text-center">
                                                <span className="text-sm">{item.PaymentMethod}</span>
                                            </td>
                                            <td className="p-3 border text-sm text-gray-600">
                                                {item.Description || "-"}
                                            </td>
                                            <td className="p-3 border text-center">
                                                {item.Receipt ? (
                                                    <a
                                                        href={`${BASE_URL}${item.Receipt}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-sm"
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 border text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditExpense(item)}
                                                        disabled={item.ExpenseType === "Salary"}
                                                        className={`p-1.5 rounded transition ${item.ExpenseType === "Salary"
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                                            }`}
                                                        title={item.ExpenseType === "Salary" ? "Salary expenses cannot be edited" : "Edit"}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExpense(item._id)}
                                                        className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-600 transition"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Total Count</p>
                    <p className="text-2xl font-bold">{expenseList.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Average Expense</p>
                    <p className="text-2xl font-bold">
                        ₹{expenseList.length > 0 ? Math.round(totalExpenses / expenseList.length).toLocaleString() : 0}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500">Expense Types</p>
                    <p className="text-2xl font-bold">{Object.keys(expenseSummary).length}</p>
                </div>
            </div>

            {/* Order Expenses Section */}
            {showOrderExpenses && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md p-6 border-l-4 border-red-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Expenses for Selected Order
                        </h3>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Total Expenses</p>
                                <p className="text-xl font-bold text-red-600">₹{orderExpenseStats.totalExpense.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Count</p>
                                <p className="text-xl font-bold text-gray-800">{orderExpenseStats.count}</p>
                            </div>
                        </div>
                    </div>

                    {loadingOrderExpenses ? (
                        <div className="text-center py-8 text-gray-500">Loading order expenses...</div>
                    ) : orderExpenses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No expenses found for this order
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-auto w-full border">
                                <thead>
                                    <tr className="bg-red-100">
                                        <th className="p-3 border text-left">Expense Title</th>
                                        <th className="p-3 border text-left">Type</th>
                                        <th className="p-3 border text-right">Amount</th>
                                        <th className="p-3 border text-center">Date</th>
                                        <th className="p-3 border text-center">Payment Method</th>
                                        <th className="p-3 border text-left">Description</th>
                                        <th className="p-3 border text-center">Receipt</th>
                                        <th className="p-3 border text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderExpenses.map((item) => (
                                        <tr key={item._id} className="hover:bg-red-50 dark:hover:bg-red-800">
                                            <td className="p-3 border font-medium">{item.ExpenseTitle}</td>
                                            <td className="p-3 border">
                                                <span className={`px-2 py-1 rounded text-xs ${item.ExpenseType === 'Salary' ? 'bg-blue-100 text-blue-800' :
                                                    item.ExpenseType === 'Operational' ? 'bg-green-100 text-green-800' :
                                                        item.ExpenseType === 'Utilities' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.ExpenseType}
                                                </span>
                                            </td>
                                            <td className="p-3 border text-right font-semibold text-red-600">
                                                ₹{item.Amount?.toLocaleString()}
                                            </td>
                                            <td className="p-3 border text-center">
                                                {new Date(item.ExpenseDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 border text-center">
                                                <span className="text-sm">{item.PaymentMethod}</span>
                                            </td>
                                            <td className="p-3 border text-sm text-gray-600">
                                                {item.Description || "-"}
                                            </td>
                                            <td className="p-3 border text-center">
                                                {item.Receipt ? (
                                                    <a
                                                        href={`${BASE_URL}${item.Receipt}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-sm"
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 border text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditExpense(item)}
                                                        disabled={item.ExpenseType === "Salary"}
                                                        className={`p-1.5 rounded transition ${item.ExpenseType === "Salary"
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                                            }`}
                                                        title={item.ExpenseType === "Salary" ? "Salary expenses cannot be edited" : "Edit"}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExpense(item._id)}
                                                        className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-600 transition"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">Loading expenses...</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="table-auto w-full border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 border text-left">Expense Title</th>
                                <th className="p-3 border text-left">Type</th>
                                <th className="p-3 border text-right">Amount</th>
                                <th className="p-3 border text-center">Date</th>
                                <th className="p-3 border text-center">Payment Method</th>
                                <th className="p-3 border text-left">Description</th>
                                <th className="p-3 border text-center">Receipt</th>
                                <th className="p-3 border text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenseList.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-4 text-center text-gray-500">
                                        No expenses found
                                    </td>
                                </tr>
                            ) : (
                                expenseList.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-3 border font-medium">
                                            {item.ExpenseTitle}
                                            {item.isFixed && (
                                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                                                    Fixed
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 border">
                                            <span className={`px-2 py-1 rounded text-xs ${item.ExpenseType === 'Salary' ? 'bg-blue-100 text-blue-800' :
                                                item.ExpenseType === 'Operational' ? 'bg-green-100 text-green-800' :
                                                    item.ExpenseType === 'Utilities' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.ExpenseType}
                                            </span>
                                        </td>
                                        <td className="p-3 border text-right font-semibold text-red-600">
                                            ₹{item.Amount?.toLocaleString()}
                                        </td>
                                        <td className="p-3 border text-center">
                                            {new Date(item.ExpenseDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 border text-center">
                                            <span className="text-sm">{item.PaymentMethod}</span>
                                        </td>
                                        <td className="p-3 border text-sm text-gray-600">
                                            {item.Description || "-"}
                                        </td>
                                        <td className="p-3 border text-center">
                                            {item.Receipt ? (
                                                <a
                                                    href={`${BASE_URL}${item.Receipt}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 border text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditExpense(item)}
                                                    disabled={item.ExpenseType === "Salary"}
                                                    className={`p-1.5 rounded transition ${item.ExpenseType === "Salary"
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                                                        }`}
                                                    title={item.ExpenseType === "Salary" ? "Salary expenses cannot be edited" : "Edit"}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExpense(item._id)}
                                                    className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-600 transition"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <AddExpenseModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onAdd={handleAddExpense}
            />
            {/* Edit Modal */}
            <EditExpenseModal
                open={openEditModal}
                onClose={() => {
                    setOpenEditModal(false);
                    setSelectedExpense(null);
                }}
                onUpdate={handleUpdateExpense}
                expense={selectedExpense}
            />
        </div >
    );
};

export default Expenses;