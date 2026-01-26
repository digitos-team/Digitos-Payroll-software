

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SummaryCard from "../SummaryCards/SummaryCard";
import Loader from "../Loader/Loader";
import CALayout from "../layouts/CALayout";

import ProfitVsExpenses from "../Charts/ProfitVsExpenses";
import ProfitVsPayroll from "../Charts/ProfitVsPayroll";
import OrdersAmountVsExpenses from "../Charts/OrdersAmountVsExpenses";

import { CheckCircle, AlertCircle, FileText, BarChart } from "lucide-react";

import {
  fetchDashboardSummary,
  fetchOrderAmountVsExpensesTrend,
  fetchProfitPayrollTrend,
  getProfitVsExpenses,
  fetchSalaryDistribution,
} from "../../../utils/CA api/CaApi";
import { useSelector } from "react-redux";

export default function CADashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [profitVsExpenses, setProfitVsExpenses] = useState([]);
  const [expensesByOrder, setExpensesByOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { companyId } = useSelector((state) => state.auth);

  // Compute current month in "YYYY-MM" format for salary distribution
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const loadData = async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        setError(null);

        // Load critical data with Promise.all
        const [
          summaryData,
          payroll,
          profitExpenses,
          orderExpenses,
        ] = await Promise.all([
          fetchDashboardSummary(),
          fetchProfitPayrollTrend(),
          getProfitVsExpenses(),
          fetchOrderAmountVsExpensesTrend(),
        ]);

        // Try to load salary distribution separately (optional)
        let salaryDist = null;
        try {
          salaryDist = await fetchSalaryDistribution(month);
        } catch (err) {
          console.warn("Salary distribution not available:", err.message);
        }

        // Overwrite or add totalTaxDeductions from salary distribution if available
        const updatedSummary = {
          ...summaryData,
          totalTaxDeductions:
            salaryDist?.totalTaxes ?? summaryData?.totalTaxDeductions ?? 0,
        };

        setSummary(updatedSummary);
        setPayrollTrend(payroll);
        setProfitVsExpenses(profitExpenses);
        setExpensesByOrder(orderExpenses);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month, companyId]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <CALayout deadlines={[]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </CALayout>
    );
  }

  return (
    <CALayout deadlines={[]}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Revenue"
          value={`₹${(summary?.totalRevenue ?? 0).toLocaleString()}`}
          icon={BarChart}
          color="bg-blue-500"
          onClick={() => navigate("/revenue")}
        />

        <SummaryCard
          title="Total Expenses"
          value={`₹${(summary?.totalExpenses ?? 0).toLocaleString()}`}
          icon={AlertCircle}
          color="bg-red-500"
        />

        <SummaryCard
          title="Total Profit"
          value={`₹${(summary?.totalProfit ?? 0).toLocaleString()}`}
          icon={CheckCircle}
          color="bg-green-600"
        />

        <SummaryCard
          title="Total Tax Deductions(Monthly)"
          value={`₹${(summary?.totalTaxDeductions ?? 0).toLocaleString()}`}
          icon={FileText}
          color="bg-indigo-500"
        />
      </div>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProfitVsExpenses data={profitVsExpenses} />
        <ProfitVsPayroll data={payrollTrend} />
      </section>
    </CALayout>
  );
}

