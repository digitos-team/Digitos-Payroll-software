import React, { useMemo, useState, useEffect } from "react";
import CALayout from "../layouts/CALayout";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { motion } from "framer-motion";
import { Calendar, AlertCircle, Loader } from "lucide-react";
import { fetchPayrollReport } from "../../../utils/CA api/CaApi";
import {
    downloadComprehensiveMonthlyReport,
    downloadAnnualReport,
    downloadSalaryReport,
    downloadMonthlyPayrollReport,
    downloadAllEmployeesCSV,
    downloadMonthlyRevenueReport,
    downloadMonthlyExpensesReport,
    downloadMonthlyOrdersReport,
    downloadMonthlyPurchasesReport,
    downloadOverallOrdersReport,
} from "../../../utils/api/reportsapi";

export default function Reports({ deadlines = [] }) {
    // ============ CHART DATA STATE ============
    const [chartData, setChartData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(true);
    const [chartError, setChartError] = useState(null);
    const [range, setRange] = useState("6"); // months

    // ============ PDF REPORT STATE ============
    // Loading states
    const [loadingComprehensive, setLoadingComprehensive] = useState(false);
    const [loadingAnnual, setLoadingAnnual] = useState(false);
    const [loadingSalary, setLoadingSalary] = useState(false);
    const [loadingCSV, setLoadingCSV] = useState(false);
    const [loadingRevenue, setLoadingRevenue] = useState(false);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingPurchases, setLoadingPurchases] = useState(false);
    const [loadingOverallOrders, setLoadingOverallOrders] = useState(false);

    // Input states
    const [comprehensiveMonth, setComprehensiveMonth] = useState("");
    const [comprehensiveYear, setComprehensiveYear] = useState(new Date().getFullYear().toString());
    const [annualYear, setAnnualYear] = useState(new Date().getFullYear().toString());
    const [salaryMonth, setSalaryMonth] = useState("");
    const [revenueMonth, setRevenueMonth] = useState("");
    const [revenueYear, setRevenueYear] = useState(new Date().getFullYear().toString());
    const [expensesMonth, setExpensesMonth] = useState("");
    const [expensesYear, setExpensesYear] = useState(new Date().getFullYear().toString());
    const [ordersMonth, setOrdersMonth] = useState("");
    const [ordersYear, setOrdersYear] = useState(new Date().getFullYear().toString());
    const [purchasesMonth, setPurchasesMonth] = useState("");
    const [purchasesYear, setPurchasesYear] = useState(new Date().getFullYear().toString());
    const [overallStartDate, setOverallStartDate] = useState("");
    const [overallEndDate, setOverallEndDate] = useState("");


    // ============ FETCH CHART DATA ============
    useEffect(() => {
        const loadPayrollReport = async () => {
            try {
                setLoadingCharts(true);
                setChartError(null);
                const reportData = await fetchPayrollReport({ months: parseInt(range) });
                setChartData(reportData);
            } catch (err) {
                console.error("Error loading payroll report:", err);
                setChartError(err.message || "Failed to load payroll report");
            } finally {
                setLoadingCharts(false);
            }
        };
        loadPayrollReport();
    }, [range]);

    const data = useMemo(() => chartData, [chartData]);


    // ============ PDF HANDLERS ============
    const handleComprehensiveDownload = async () => {
        if (!comprehensiveMonth || !comprehensiveYear) {
            alert("Please select both month and year");
            return;
        }
        setLoadingComprehensive(true);
        try {
            await downloadComprehensiveMonthlyReport(comprehensiveMonth, comprehensiveYear);
            alert("Comprehensive report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingComprehensive(false);
        }
    };

    const handleAnnualDownload = async () => {
        if (!annualYear) {
            alert("Please select a year");
            return;
        }
        setLoadingAnnual(true);
        try {
            await downloadAnnualReport(annualYear);
            alert("Annual report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingAnnual(false);
        }
    };

    const handleSalaryDownload = async () => {
        setLoadingSalary(true);
        try {
            await downloadSalaryReport(salaryMonth || null);
            alert("Salary report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingSalary(false);
        }
    };

    const handleRevenueDownload = async () => {
        if (!revenueMonth || !revenueYear) {
            alert("Please select both month and year");
            return;
        }
        setLoadingRevenue(true);
        try {
            await downloadMonthlyRevenueReport(revenueMonth, revenueYear);
            alert("Revenue report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingRevenue(false);
        }
    };

    const handleExpensesDownload = async () => {
        if (!expensesMonth || !expensesYear) {
            alert("Please select both month and year");
            return;
        }
        setLoadingExpenses(true);
        try {
            await downloadMonthlyExpensesReport(expensesMonth, expensesYear);
            alert("Expenses report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingExpenses(false);
        }
    };

    const handleOrdersDownload = async () => {
        if (!ordersMonth || !ordersYear) {
            alert("Please select both month and year");
            return;
        }
        setLoadingOrders(true);
        try {
            await downloadMonthlyOrdersReport(ordersMonth, ordersYear);
            alert("Orders report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingOrders(false);
        }
    };

    const handlePurchasesDownload = async () => {
        if (!purchasesMonth || !purchasesYear) {
            alert("Please select both month and year");
            return;
        }
        setLoadingPurchases(true);
        try {
            await downloadMonthlyPurchasesReport(purchasesMonth, purchasesYear);
            alert("Purchases report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingPurchases(false);
        }
    };

    const handleOverallOrdersDownload = async () => {
        setLoadingOverallOrders(true);
        try {
            await downloadOverallOrdersReport(overallStartDate || null, overallEndDate || null);
            alert("Overall orders report downloaded successfully!");
        } catch (error) {
            alert("Failed to download report. Please try again.");
        } finally {
            setLoadingOverallOrders(false);
        }
    };

    const handleExportCSV = async () => {
        setLoadingCSV(true);
        try {
            await downloadAllEmployeesCSV();
            alert("Employees CSV exported successfully!");
        } catch (error) {
            alert("Failed to export CSV. Please try again.");
        } finally {
            setLoadingCSV(false);
        }
    };


    return (
        <CALayout deadlines={deadlines}>
            <div className="p-6 space-y-8">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-2xl font-bold text-[#345B87]">Reports & Analytics</h2>
                    <p className="text-sm text-[#4C5A69] mt-1">
                        Visualize financial trends and generate detailed PDF reports.
                    </p>
                </motion.div>

                {/* ==================== CHARTS SECTION ==================== */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Financial Overview</h3>

                    </div>

                    {chartError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700">{chartError}</span>
                        </div>
                    )}

                    {loadingCharts ? (
                        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow border border-[#CBDCEB]">
                            <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-xl border border-[#CBDCEB] shadow-sm">
                                    <p className="text-sm text-[#4C5A69]">Total Payroll</p>
                                    <h3 className="text-2xl font-bold text-[#345B87]">
                                        ₹{data.reduce((sum, d) => sum + d.payrollCost, 0).toLocaleString()}
                                    </h3>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-[#CBDCEB] shadow-sm">
                                    <p className="text-sm text-[#4C5A69]">Total Tax Collected</p>
                                    <h3 className="text-2xl font-bold text-[#345B87]">
                                        ₹{data.reduce((sum, d) => sum + d.tax, 0).toLocaleString()}
                                    </h3>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-[#CBDCEB] shadow-sm">
                                    <p className="text-sm text-[#4C5A69]">Avg Monthly Payroll</p>
                                    <h3 className="text-2xl font-bold text-[#345B87]">
                                        ₹
                                        {data.length > 0
                                            ? Math.round(
                                                data.reduce((sum, d) => sum + d.payrollCost, 0) / data.length
                                            ).toLocaleString()
                                            : 0}
                                    </h3>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-xl border border-[#CBDCEB] shadow">
                                    <h4 className="text-lg font-semibold text-[#345B87] mb-3">Payroll Cost Trend</h4>
                                    <div style={{ width: "100%", height: 300 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={data}>
                                                <CartesianGrid stroke="#f0f0f0" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line
                                                    type="monotone"
                                                    dataKey="payrollCost"
                                                    stroke="#345B87"
                                                    strokeWidth={2}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-[#CBDCEB] shadow">
                                    <h4 className="text-lg font-semibold text-[#345B87] mb-3">Tax Collected (Monthly)</h4>
                                    <div style={{ width: "100%", height: 300 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={data}>
                                                <CartesianGrid stroke="#f0f0f0" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="tax" fill="#6D94C5" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* ==================== PDF REPORT GENERATION SECTION ==================== */}
                <section>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Generate PDF Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Comprehensive Monthly Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-indigo-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Comprehensive Monthly Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Revenue, Expenses, Orders & Purchases combined</p>
                                </div>
                                <div className="bg-indigo-100 p-3 rounded-lg"><div className="w-6 h-6 text-indigo-600">📊</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Month</label>
                                        <input type="month" value={comprehensiveMonth} onChange={(e) => setComprehensiveMonth(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Year</label>
                                        <input type="number" value={comprehensiveYear} onChange={(e) => setComprehensiveYear(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={handleComprehensiveDownload} disabled={loadingComprehensive} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingComprehensive ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Annual Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Annual Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Yearly financial summary and breakdown</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg"><div className="w-6 h-6 text-green-600">📅</div></div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">Year</label>
                                    <input type="number" value={annualYear} onChange={(e) => setAnnualYear(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                </div>
                                <button onClick={handleAnnualDownload} disabled={loadingAnnual} className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingAnnual ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Salary Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-yellow-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Salary Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Employee salary slips & department breakdown</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-lg"><div className="w-6 h-6 text-yellow-600">💰</div></div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">Month (Optional)</label>
                                    <input type="month" value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                </div>
                                <button onClick={handleSalaryDownload} disabled={loadingSalary} className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingSalary ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Monthly Revenue Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Monthly Revenue Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Revenue breakdown</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg"><div className="w-6 h-6 text-blue-600">📈</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Month</label>
                                        <input type="month" value={revenueMonth} onChange={(e) => setRevenueMonth(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Year</label>
                                        <input type="number" value={revenueYear} onChange={(e) => setRevenueYear(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={handleRevenueDownload} disabled={loadingRevenue} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingRevenue ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Monthly Expenses Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Monthly Expenses Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Expenses breakdown</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-lg"><div className="w-6 h-6 text-red-600">📉</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Month</label>
                                        <input type="month" value={expensesMonth} onChange={(e) => setExpensesMonth(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Year</label>
                                        <input type="number" value={expensesYear} onChange={(e) => setExpensesYear(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={handleExpensesDownload} disabled={loadingExpenses} className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingExpenses ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Monthly Orders Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Monthly Orders Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Orders summary</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg"><div className="w-6 h-6 text-purple-600">📦</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Month</label>
                                        <input type="month" value={ordersMonth} onChange={(e) => setOrdersMonth(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Year</label>
                                        <input type="number" value={ordersYear} onChange={(e) => setOrdersYear(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={handleOrdersDownload} disabled={loadingOrders} className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingOrders ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Monthly Purchases Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-teal-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Monthly Purchases Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Profit analysis</p>
                                </div>
                                <div className="bg-teal-100 p-3 rounded-lg"><div className="w-6 h-6 text-teal-600">🛍️</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Month</label>
                                        <input type="month" value={purchasesMonth} onChange={(e) => setPurchasesMonth(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Year</label>
                                        <input type="number" value={purchasesYear} onChange={(e) => setPurchasesYear(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={handlePurchasesDownload} disabled={loadingPurchases} className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingPurchases ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Overall Orders Report Card */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">Overall Orders Report</h4>
                                    <p className="text-sm text-gray-500 mt-1">Orders with date range</p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-lg"><div className="w-6 h-6 text-orange-600">📋</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Start Date</label>
                                        <input type="date" value={overallStartDate} onChange={(e) => setOverallStartDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">End Date</label>
                                        <input type="date" value={overallEndDate} onChange={(e) => setOverallEndDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <button onClick={handleOverallOrdersDownload} disabled={loadingOverallOrders} className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2">
                                    {loadingOverallOrders ? "Generating..." : "Generate PDF"}
                                </button>
                            </div>
                        </div>

                    </div>
                </section>



            </div>
        </CALayout>
    );
}
