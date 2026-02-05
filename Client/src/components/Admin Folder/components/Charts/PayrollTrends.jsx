import React, { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { getRevenueVsExpenseTrend, getOrderVsExpenseTrend } from '../../../../utils/api/revenueapi'

function RsTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-sm border">
        <div className="font-semibold mb-1">{label}</div>
        {payload.map((p) => (
          <div
            key={p.dataKey}
            className="text-gray-700"
            style={{ color: p.color }}
          >
            {p.name}: ₹ {p.value?.toLocaleString()}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function PayrollTrends() {
  const [data, setData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [orderData, setOrderData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const trendData = await getRevenueVsExpenseTrend();
      // Sort by month just in case
      const sorted = trendData.sort((a, b) => a.Month.localeCompare(b.Month));
      setData(sorted);
      const revExpTrend = await getRevenueVsExpenseTrend();
      const sortedRev = revExpTrend.sort((a, b) =>
        a.Month.localeCompare(b.Month)
      );
      setRevenueData(sortedRev);

      // ================= ORDER vs EXPENSE (FIXED HERE) =================
      const ordExpTrend = await getOrderVsExpenseTrend();


      // Handle both shapes:
      // 1) [{ Month, orders, expense }]
      // 2) { success: true, trend: [{ ... }] }
      let trendArray = [];

      if (Array.isArray(ordExpTrend)) {
        trendArray = ordExpTrend;
      } else if (
        ordExpTrend &&
        Array.isArray(ordExpTrend.trend)
      ) {
        trendArray = ordExpTrend.trend;
      }

      const sortedOrder = [...trendArray].sort((a, b) =>
        (a.Month || '').localeCompare(b.Month || '')
      );

      setOrderData(sortedOrder);

    };
    fetchData();
  }, []);

  //     return (
  //         <div>
  //             <h3 className="text-lg font-semibold mb-4 text-gray-700">Revenue & Expense Trends</h3>
  //             <div style={{ width: '100%', height: 300 }}>
  //                 <ResponsiveContainer>
  //                     <LineChart data={data}>
  //                         <CartesianGrid strokeDasharray="3 3" />
  //                         <XAxis
  //                             dataKey="Month"
  //                             tickFormatter={(tick) => {
  //                                 // Format YYYY-MM to Month Name (e.g., "Jan")
  //                                 if (!tick) return "";
  //                                 const date = new Date(tick + "-01");
  //                                 return date.toLocaleDateString('en-US', { month: 'short' });
  //                             }}
  //                         />
  //                         <YAxis />
  //                         <Tooltip content={<RsTooltip />} />
  //                         <Legend formatter={(value) => value === 'revenue' ? 'Revenue' : 'Expenses'} />
  //                         <Line type="monotone" dataKey="revenue" name="revenue" stroke="#16a34a" strokeWidth={2} />
  //                         <Line type="monotone" dataKey="expense" name="expense" stroke="#dc2626" strokeWidth={2} />
  //                     </LineChart>
  //                 </ResponsiveContainer>
  //             </div>
  //         </div>
  //     )
  // }

  return (
    <div>
      {/* ======================= Revenue vs Expense ======================= */}
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Revenue & Expense Trends
      </h3>
      <div style={{ width: '100%', height: 300 }} className="mb-10">
        <ResponsiveContainer>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Month"
              tickFormatter={(tick) => {
                if (!tick) return '';
                const date = new Date(tick + '-01');
                return date.toLocaleDateString('en-US', { month: 'short' });
              }}
            />
            <YAxis />
            <Tooltip content={<RsTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#16a34a"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#dc2626"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ======================= Order vs Expense ======================= */}
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Order & Expense Trends
      </h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={orderData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Month"
              tickFormatter={(tick) => {
                if (!tick) return '';
                const date = new Date(tick + '-01');
                return date.toLocaleDateString('en-US', { month: 'short' });
              }}
            />
            <YAxis />
            <Tooltip content={<RsTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#dc2626"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}