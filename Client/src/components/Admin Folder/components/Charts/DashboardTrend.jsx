
import React, { useEffect, useState } from 'react'

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend
} from 'recharts'
import {
    getProfitVsExpenseTrend,
    getProfitVsPayrollTrend
} from '../../../../utils/api/revenueapi'

// Tooltip Component
function TrendTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 rounded shadow text-sm border">
                <div className="font-semibold mb-1">{label}</div>
                {payload.map((p) => (
                    <div key={p.dataKey} className="text-gray-700" style={{ color: p.color }}>
                        {p.name === 'profit'
                            ? 'Profit'
                            : p.name === 'payroll'
                                ? 'Payroll'
                                : 'Expenses'}: ₹ {p.value.toLocaleString()}
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function ProfitVsExpenseChart() {
    const [expenseData, setExpenseData] = useState([]);
    const [payrollData, setPayrollData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Profit vs Expense
            const expenseTrend = await getProfitVsExpenseTrend();
            const sortedExpense = expenseTrend.sort((a, b) => a.Month.localeCompare(b.Month));
            setExpenseData(sortedExpense);

            // Fetch Profit vs Payroll
            const payrollTrend = await getProfitVsPayrollTrend();
            const sortedPayroll = payrollTrend.sort((a, b) => a.Month.localeCompare(b.Month));
            setPayrollData(sortedPayroll);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-12">
            {/* Profit vs Expense Chart */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Profit vs Expense Trends
                </h3>

                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={expenseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="Month"
                                tickFormatter={(tick) => {
                                    if (!tick) return "";
                                    const date = new Date(tick + "-01");
                                    return date.toLocaleDateString('en-US', { month: 'short' });
                                }}
                            />
                            <YAxis />
                            <Tooltip content={<TrendTooltip />} />
                            <Legend
                                formatter={(value) =>
                                    value === 'profit' ? 'Profit' : 'Expenses'
                                }
                            />

                            <Line
                                type="monotone"
                                dataKey="profit"
                                name="profit"
                                stroke="#2563eb"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="expense"
                                name="expense"
                                stroke="#dc2626"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Profit vs Payroll Chart */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Profit vs Payroll Trends
                </h3>

                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={payrollData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="Month"
                                tickFormatter={(tick) => {
                                    if (!tick) return "";
                                    const date = new Date(tick + "-01");
                                    return date.toLocaleDateString('en-US', { month: 'short' });
                                }}
                            />
                            <YAxis />
                            <Tooltip content={<TrendTooltip />} />
                            <Legend
                                formatter={(value) =>
                                    value === 'profit' ? 'Profit' : 'Payroll'
                                }
                            />

                            <Line
                                type="monotone"
                                dataKey="profit"
                                name="profit"
                                stroke="#7c3aed"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="payroll"
                                name="payroll"
                                stroke="#f59e0b"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
