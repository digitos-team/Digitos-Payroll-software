import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { fetchPayrollHistory } from "../../../utils/CA api/CaApi";
import { getPayrollByBranch } from "../utils/api/SalaryAPi";
import { MdHistory, MdBusiness, MdLocationOn, MdRefresh } from "react-icons/md";

const PayrollHistory = () => {
    const [activeSection, setActiveSection] = useState('payroll-history');
    const [history, setHistory] = useState([]);
    const [branchPayroll, setBranchPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1); // Default to current month
    const [year, setYear] = useState(new Date().getFullYear());
    const { companyId } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;

    const sections = [
        { id: 'payroll-history', label: 'Payroll History', icon: <MdHistory size={20} /> },
        { id: 'by-department', label: 'Payroll by Department', icon: <MdBusiness size={20} /> },
        { id: 'by-branch', label: 'Payroll by Branch', icon: <MdLocationOn size={20} /> }
    ];

    const loadAllData = useCallback(async () => {
        if (!actualCompanyId) return;

        try {
            setLoading(true);
            const [historyRes, branchPayrollRes] = await Promise.allSettled([
                fetchPayrollHistory({ CompanyId: actualCompanyId, Year: year, ...(month && { Month: month }) }),
                getPayrollByBranch(month, year, actualCompanyId)
            ]);

            // Process payroll history
            if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
                setHistory(historyRes.value.data || []);
            } else {
                setHistory([]);
            }

            // Process branch payroll from API
            if (branchPayrollRes.status === 'fulfilled') {
                // Handle new response structure: { success: true, period: {...}, data: [...] }
                const responseData = branchPayrollRes.value;
                const branchData = responseData?.data || [];

                const mappedBranchData = (Array.isArray(branchData) ? branchData : []).map(item => ({
                    ...item,
                    branchName: item.branchName || "Unknown Branch",
                    totalPayroll: item.totalPayroll || 0,
                    employeeCount: item.employeeCount || 0
                }));
                setBranchPayroll(mappedBranchData);
            } else {
                setBranchPayroll([]);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    }, [actualCompanyId, month, year]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Group payroll by department
    const getPayrollByDepartmentGrouped = () => {
        const grouped = {};
        history.forEach(record => {
            const deptName = record.DepartmentName || 'Unassigned';
            if (!grouped[deptName]) {
                grouped[deptName] = {
                    department: deptName,
                    employees: [],
                    totalGross: 0,
                    totalDeductions: 0,
                    totalNet: 0,
                    totalTax: 0
                };
            }
            grouped[deptName].employees.push(record);
            grouped[deptName].totalGross += record.grossSalary || 0;
            grouped[deptName].totalDeductions += record.totalDeductions || 0;
            grouped[deptName].totalNet += record.netSalary || 0;
            grouped[deptName].totalTax += record.TaxAmount || 0;
        });
        return Object.values(grouped);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll History</h2>
                    <p className="text-gray-500 dark:text-gray-400">View payroll records by employee, department, or branch</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Month Selector */}
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    {/* Year Selector */}
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button
                        onClick={loadAllData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <MdRefresh className={loading ? 'animate-spin' : ''} size={20} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-4 overflow-x-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${activeSection === section.id
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {section.icon}
                            {section.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                {loading ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <MdRefresh className="animate-spin mx-auto mb-2" size={32} />
                        Loading payroll data...
                    </div>
                ) : (
                    <>
                        {/* Payroll History Section */}
                        {activeSection === 'payroll-history' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Payroll Records</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total: {history.length}</span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Employee</th>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Department</th>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Month</th>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Gross Salary</th>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Total Deductions</th>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Net Salary</th>
                                                <th className="py-3 px-4 text-gray-600 dark:text-gray-300">Tax</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.length > 0 ? (
                                                history.map((record) => (
                                                    <tr key={record._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{record.EmployeeName || "N/A"}</td>
                                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{record.DepartmentName || "N/A"}</td>
                                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{record.Month}</td>
                                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">₹{record.grossSalary?.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-red-500">-₹{record.totalDeductions?.toLocaleString()}</td>
                                                        <td className="py-3 px-4 font-medium text-green-600">₹{record.netSalary?.toLocaleString()}</td>
                                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">₹{record.TaxAmount?.toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-8 text-gray-400 dark:text-gray-500">
                                                        No payroll history found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Payroll by Department Section */}
                        {activeSection === 'by-department' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payroll by Department</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Departments: {getPayrollByDepartmentGrouped().length}
                                    </span>
                                </div>

                                {getPayrollByDepartmentGrouped().length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No payroll data available
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {getPayrollByDepartmentGrouped().map((dept, index) => (
                                            <div key={index} className="border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
                                                        <MdBusiness className="text-green-600 dark:text-green-400" size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{dept.department}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{dept.employees.length} employees</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Gross Salary</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">₹{dept.totalGross.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Deductions</span>
                                                        <span className="font-medium text-red-500">-₹{dept.totalDeductions.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                                                        <span className="text-gray-500 dark:text-gray-400">Net Salary</span>
                                                        <span className="font-bold text-green-600">₹{dept.totalNet.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payroll by Branch Section */}
                        {activeSection === 'by-branch' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payroll by Branch</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Branches: {branchPayroll.length}
                                    </span>
                                </div>

                                {branchPayroll.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No payroll data available
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {branchPayroll.map((branch, index) => (
                                            <div key={branch.branchId || index} className="border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-lg">
                                                        <MdLocationOn className="text-orange-600 dark:text-orange-400" size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{branch.branchName || 'Unknown Branch'}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{branch.employeeCount || 0} employees</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                                                        <span className="text-gray-500 dark:text-gray-400">Total Payroll</span>
                                                        <span className="font-bold text-green-600">₹{(branch.totalPayroll || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PayrollHistory;
