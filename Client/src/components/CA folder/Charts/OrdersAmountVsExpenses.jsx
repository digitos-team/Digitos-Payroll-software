import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function OrdersAmountVsExpenses({ data }) {
  // Add safety check for undefined/null data
  if (!data || !Array.isArray(data)) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Orders Amount vs Orders Expenses
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Transform API keys: "Month" → "month", "orders" → "ordersAmount", "expense" → "ordersExpense"
  console.log(data);
  const formattedData = data.map(({ Month, orders, expense }) => ({
    month: Month,       
    ordersAmount: orders,   
    ordersExpense: expense, 
  }));
  console.log("Formatted Data for Chart:", formattedData);

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Orders Amount vs Orders Expenses
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="ordersAmount"
            stroke="#3b82f6"
            fill="#3b82f6"
            name="Orders Amount"
          />
          <Area
            type="monotone"
            dataKey="ordersExpense"
            stroke="#ef4444"
            fill="#ef4444"
            name="Orders Expense"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}