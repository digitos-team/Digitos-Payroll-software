import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { fetchPayrollReport } from "../../../utils/CA api/CaApi";

const PayrollTrendChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { companyId } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;

    useEffect(() => {
        const loadData = async () => {
            try {
                if (actualCompanyId) {
                    const trendData = await fetchPayrollReport();
                    setData(trendData);
                }
            } catch (error) {
                console.error("Failed to load payroll trend", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [actualCompanyId]);

    if (loading) return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
    if (!data.length) return <div className="h-64 flex items-center justify-center text-gray-400">No payroll data available</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Payroll Cost Trend (Last 6 Months)</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="payrollCost" name="Total Payroll Cost" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="tax" name="Total Tax" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PayrollTrendChart;
