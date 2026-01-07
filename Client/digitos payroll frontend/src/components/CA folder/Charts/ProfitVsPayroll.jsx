
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ProfitVsPayroll({ data }) {
  // Transform API data keys to match chart keys
  const formattedData = data.map(({ Month, profit, payroll }) => ({
    month: Month,  // rename Month to month for XAxis
    profit,
    payroll,
  }));

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Profit vs Payroll
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" />
          <Line type="monotone" dataKey="payroll" stroke="#3b82f6" name="Payroll" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
