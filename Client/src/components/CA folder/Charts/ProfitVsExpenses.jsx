
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ProfitVsExpenses({ data }) {

  // Optional: transform data keys if needed
  const formattedData = data.map(({ Month, profit, expense }) => ({
    month: Month, // rename Month to month for XAxis dataKey
    profit,
    expense,
  }));

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Profit vs Expenses
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="profit" fill="#10b981" name="Profit" />
          <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

