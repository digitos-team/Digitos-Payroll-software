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
import { Download, Calendar, AlertCircle, Loader } from "lucide-react";
// import your API function
import { fetchPayrollReport } from "../../../utils/CA api/CaApi";

export default function ViewPayrollReport({ deadlines = [] }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("6"); // months

  // Load payroll report on mount and when range changes
  useEffect(() => {
    const loadPayrollReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const reportData = await fetchPayrollReport({ months: parseInt(range) });
        setChartData(reportData);
      } catch (err) {
        console.error("Error loading payroll report:", err);
        setError(err.message || "Failed to load payroll report");
      } finally {
        setLoading(false);
      }
    };
    loadPayrollReport();
  }, [range]);

  const data = useMemo(() => chartData, [chartData]);

  const exportCSV = () => {
    const rows = [["Month", "PayrollCost", "Tax"], ...data.map(d => [d.month, d.payrollCost, d.tax])];
    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CALayout deadlines={deadlines}>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-[#345B87]">Payroll Reports</h2>
          <p className="text-sm text-[#4C5A69] mt-1">
            Visualize payroll spend, tax, and export financial reports.
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border rounded-lg p-2 gap-2">
                <Calendar size={16} />
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="outline-none"
                >
                  <option value="3">Last 3 months</option>
                  <option value="6">Last 6 months</option>
                  <option value="12">Last 12 months</option>
                </select>
              </div>

              <div className="ml-auto">

              </div>
            </div>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
            </section>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-xl border border-[#CBDCEB]">
                <p className="text-sm text-[#4C5A69]">Total Payroll (range)</p>
                <h3 className="text-2xl font-bold text-[#345B87]">
                  ₹{data.reduce((sum, d) => sum + d.payrollCost, 0).toLocaleString()}
                </h3>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#CBDCEB]">
                <p className="text-sm text-[#4C5A69]">Total Tax (range)</p>
                <h3 className="text-2xl font-bold text-[#345B87]">
                  ₹{data.reduce((sum, d) => sum + d.tax, 0).toLocaleString()}
                </h3>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#CBDCEB]">
                <p className="text-sm text-[#4C5A69]">Average Monthly Payroll</p>
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
          </>
        )}
      </div>
    </CALayout>
  );
}
