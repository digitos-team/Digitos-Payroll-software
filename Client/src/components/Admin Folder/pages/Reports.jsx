import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useBranches } from "../context/BranchContext";
import SummaryCard from "../components/SummaryCard/SummaryCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { exportToCSV } from "../../../utils/exportUtils";
import toast from 'react-hot-toast';
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
import { getEmployeeCount } from "../../../utils/api/employeeapi";
import { getTotalPayroll } from "../../../utils/api/payrollapi";

export default function Reports() {
  const { branches, departments, employees, payrollRecords, employeeCountByDept } = useBranches();
  const { companyId } = useSelector((state) => state.auth);

  // State for API-fetched totals
  const [totals, setTotals] = useState({
    totalEmployees: 0,
    totalSalaryFromEmployees: 0,
    totalPayrollRecords: 0,
    avgSalary: 0,
  });
  const [loadingTotals, setLoadingTotals] = useState(true);

  // PDF Report states
  const [comprehensiveMonth, setComprehensiveMonth] = useState("");
  const [comprehensiveYear, setComprehensiveYear] = useState(new Date().getFullYear().toString());
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear().toString());
  const [salaryMonth, setSalaryMonth] = useState("");
  const [payrollMonth, setPayrollMonth] = useState("");

  // Loading states
  const [loadingComprehensive, setLoadingComprehensive] = useState(false);
  const [loadingAnnual, setLoadingAnnual] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingOverallOrders, setLoadingOverallOrders] = useState(false);

  // New report states
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

  // Fetch totals from APIs
  useEffect(() => {
    const fetchTotals = async () => {
      const actualCompanyId = companyId?._id || companyId;
      if (!actualCompanyId) {
        setLoadingTotals(false);
        return;
      }

      try {
        setLoadingTotals(true);

        // Fetch employee count and payroll from backend
        const [employeeRes, payrollRes] = await Promise.allSettled([
          getEmployeeCount(actualCompanyId),
          getTotalPayroll(actualCompanyId),
        ]);

        let totalEmployees = 0;
        let totalPayroll = 0;

        // Extract employee count
        if (employeeRes.status === "fulfilled") {
          totalEmployees = employeeRes.value?.total || employeeRes.value?.data?.total || 0;
        }

        // Extract payroll total
        if (payrollRes.status === "fulfilled") {
          totalPayroll = payrollRes.value || 0;
        }

        // Calculate average salary
        const avgSalary = totalEmployees > 0 ? Math.round(totalPayroll / totalEmployees) : 0;

        setTotals({
          totalEmployees,
          totalSalaryFromEmployees: totalPayroll,
          totalPayrollRecords: totalPayroll,
          avgSalary,
        });
      } catch (err) {
        console.error("Error fetching totals:", err);
      } finally {
        setLoadingTotals(false);
      }
    };

    fetchTotals();
  }, [companyId]);

  const payrollByBranch = useMemo(() => {
    return branches.map((b) => ({
      name: b.name,
      total: employees
        .filter((e) => e.branchId === b.id)
        .reduce((s, e) => s + (Number(e.salary) || 0), 0),
    }));
  }, [branches, employees]);

  // PDF Download Handlers
  const handleComprehensiveDownload = async () => {
    if (!comprehensiveMonth || !comprehensiveYear) {
      toast.error("Please select both month and year");
      return;
    }
    setLoadingComprehensive(true);
    try {
      await downloadComprehensiveMonthlyReport(comprehensiveMonth, comprehensiveYear);
      toast.success("Comprehensive report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingComprehensive(false);
    }
  };

  const handleAnnualDownload = async () => {
    if (!annualYear) {
      toast.error("Please select a year");
      return;
    }
    setLoadingAnnual(true);
    try {
      await downloadAnnualReport(annualYear);
      toast.success("Annual report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingAnnual(false);
    }
  };

  const handleSalaryDownload = async () => {
    setLoadingSalary(true);
    try {
      await downloadSalaryReport(salaryMonth || null);
      toast.success("Salary report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingSalary(false);
    }
  };

  const handleRevenueDownload = async () => {
    if (!revenueMonth || !revenueYear) {
      toast.error("Please select both month and year");
      return;
    }
    setLoadingRevenue(true);
    try {
      await downloadMonthlyRevenueReport(revenueMonth, revenueYear);
      toast.success("Revenue report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingRevenue(false);
    }
  };

  const handleExpensesDownload = async () => {
    if (!expensesMonth || !expensesYear) {
      toast.error("Please select both month and year");
      return;
    }
    setLoadingExpenses(true);
    try {
      await downloadMonthlyExpensesReport(expensesMonth, expensesYear);
      toast.success("Expenses report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleOrdersDownload = async () => {
    if (!ordersMonth || !ordersYear) {
      toast.error("Please select both month and year");
      return;
    }
    setLoadingOrders(true);
    try {
      await downloadMonthlyOrdersReport(ordersMonth, ordersYear);
      toast.success("Orders report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePurchasesDownload = async () => {
    if (!purchasesMonth || !purchasesYear) {
      toast.error("Please select both month and year");
      return;
    }
    setLoadingPurchases(true);
    try {
      await downloadMonthlyPurchasesReport(purchasesMonth, purchasesYear);
      toast.success("Purchases report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleOverallOrdersDownload = async () => {
    setLoadingOverallOrders(true);
    try {
      await downloadOverallOrdersReport(overallStartDate || null, overallEndDate || null);
      toast.success("Overall orders report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report. Please try again.");
    } finally {
      setLoadingOverallOrders(false);
    }
  };


  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold dark:text-gray-100">Reports & Analytics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate comprehensive PDF reports and analyze employee data
        </p>
      </header>

      {/* Summary Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Employees"
            value={totals.totalEmployees}
            Icon={() => null}
            color={"bg-blue-500"}
          />
          <SummaryCard
            title="Total Payroll"
            value={`₹ ${totals.totalSalaryFromEmployees.toLocaleString()}`}
            Icon={() => null}
            color={"bg-green-500"}
          />
          <SummaryCard
            title="Average Salary"
            value={`₹ ${totals.avgSalary.toLocaleString()}`}
            Icon={() => null}
            color={"bg-purple-500"}
          />
        </div>
      </section>

      {/* PDF Report Generation Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Generate PDF Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Comprehensive Monthly Report Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Comprehensive Monthly Report</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Revenue, Expenses, Orders & Purchases combined
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Month</label>
                  <input
                    type="month"
                    value={comprehensiveMonth}
                    onChange={(e) => setComprehensiveMonth(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Year</label>
                  <input
                    type="number"
                    value={comprehensiveYear}
                    onChange={(e) => setComprehensiveYear(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>
              <button
                onClick={handleComprehensiveDownload}
                disabled={loadingComprehensive}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingComprehensive ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Annual Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Annual Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Yearly financial summary and breakdown
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Year</label>
                <input
                  type="number"
                  value={annualYear}
                  onChange={(e) => setAnnualYear(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="2024"
                />
              </div>
              <button
                onClick={handleAnnualDownload}
                disabled={loadingAnnual}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingAnnual ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Salary Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Salary Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Employee salary slips & department breakdown
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Month (Optional - Leave blank for all)</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleSalaryDownload}
                disabled={loadingSalary}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingSalary ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monthly Revenue Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Monthly Revenue Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Revenue breakdown for a specific month
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Month</label>
                  <input
                    type="month"
                    value={revenueMonth}
                    onChange={(e) => setRevenueMonth(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Year</label>
                  <input
                    type="number"
                    value={revenueYear}
                    onChange={(e) => setRevenueYear(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>
              <button
                onClick={handleRevenueDownload}
                disabled={loadingRevenue}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingRevenue ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monthly Expenses Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Monthly Expenses Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Expenses breakdown for a specific month
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Month</label>
                  <input
                    type="month"
                    value={expensesMonth}
                    onChange={(e) => setExpensesMonth(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Year</label>
                  <input
                    type="number"
                    value={expensesYear}
                    onChange={(e) => setExpensesYear(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>
              <button
                onClick={handleExpensesDownload}
                disabled={loadingExpenses}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingExpenses ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monthly Orders Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Monthly Orders Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Orders summary for a specific month
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Month</label>
                  <input
                    type="month"
                    value={ordersMonth}
                    onChange={(e) => setOrdersMonth(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Year</label>
                  <input
                    type="number"
                    value={ordersYear}
                    onChange={(e) => setOrdersYear(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>
              <button
                onClick={handleOrdersDownload}
                disabled={loadingOrders}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingOrders ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monthly Purchases Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-teal-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Monthly Purchases Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Profit analysis for paid orders
                </p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Month</label>
                  <input
                    type="month"
                    value={purchasesMonth}
                    onChange={(e) => setPurchasesMonth(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Year</label>
                  <input
                    type="number"
                    value={purchasesYear}
                    onChange={(e) => setPurchasesYear(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2024"
                  />
                </div>
              </div>
              <button
                onClick={handlePurchasesDownload}
                disabled={loadingPurchases}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingPurchases ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Overall Orders Report Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Overall Orders Report</h4>
                <p className="text-sm text-gray-500 mt-1">
                  All orders with optional date range filter
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={overallStartDate}
                    onChange={(e) => setOverallStartDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={overallEndDate}
                    onChange={(e) => setOverallEndDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleOverallOrdersDownload}
                disabled={loadingOverallOrders}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingOverallOrders ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Employee Data Analysis Section */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Employee CSV Export</h3>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-gray-600">
                Download a complete list of all employees and their details in CSV format.
              </p>
            </div>
            <button
              onClick={async () => {
                setLoadingCSV(true);
                try {
                  await downloadAllEmployeesCSV();
                  toast.success("Employees CSV exported successfully!");
                } catch (error) {
                  toast.error("Failed to export CSV. Please try again.");
                } finally {
                  setLoadingCSV(false);
                }
              }}
              disabled={loadingCSV}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingCSV ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All Employees CSV
                </>
              )}
            </button>
          </div>
        </div>
      </section>


    </div >
  );
}
