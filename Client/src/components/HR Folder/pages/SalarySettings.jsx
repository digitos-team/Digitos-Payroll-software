import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
    MdSettings,
    MdReceipt,
    MdAttachMoney,
    MdDownload,
    MdRefresh,
    MdExpandMore,
    MdExpandLess,
    MdPlayArrow,
    MdDelete,
    MdNotifications
} from 'react-icons/md';
import ConfigureSalaryModal from '../components/Modals/ConfigureSalaryModal';
import AddSalaryHeadModal from '../../Admin Folder/components/Modals/AddSalaryHeadModal';
import { fetchSalaryHeads, addSalaryHead, deleteSalaryHead } from '../../../utils/api/salaryheads';
import {
    addOrUpdateSalarySetting,
    calculateSalaryForAll,
    calculateSalaryDetailed,
    getSalarySettings,
    generatePayslipPDF,
    getTotalSalaryDistribution,
    deleteSalarySetting,
    getHRNotifications,
    markNotificationRead,
    fetchSalaryRequests
} from '../utils/api/SalaryAPi';
import { getAllEmployees } from '../utils/api/EmployeeApi';

import axiosInstance from '../../../utils/axiosInstance';
export default function SalarySetting() {
    const [activeTab, setActiveTab] = useState('salary-heads');
    const [salaryHeads, setSalaryHeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [salarySettings, setSalarySettings] = useState([]);
    const [generatedSlips, setGeneratedSlips] = useState({}); // { employeeId: slipData }
    const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
    const [isAddSalaryHeadModalOpen, setIsAddSalaryHeadModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [expandedSlip, setExpandedSlip] = useState(null);
    const [distribution, setDistribution] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const { companyId: reduxCompanyId } = useSelector((state) => state.auth || {});
    // Extract company ID - handle both object and string formats
    const targetCompanyId = reduxCompanyId?._id || reduxCompanyId;

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Load data depending on activeTab
    const loadData = useCallback(async () => {
        if (!targetCompanyId) return;
        setLoading(true);
        try {
            if (activeTab === 'salary-heads') {
                const heads = await fetchSalaryHeads(targetCompanyId);
                setSalaryHeads(heads || []);
            } else if (activeTab === 'salary-settings') {
                // Load employees, salary heads, and existing salary settings
                const [empRes, heads, settings, pendingReq] = await Promise.all([
                    getAllEmployees(targetCompanyId),
                    fetchSalaryHeads(targetCompanyId),
                    getSalarySettings(targetCompanyId),
                    fetchSalaryRequests(targetCompanyId)
                ]);

                const empList = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);
                const settingsList = settings || [];
                const pendingList = pendingReq?.data || [];

                setPendingRequests(pendingList);

                // Merge employee data with salary settings (handle populated and unpopulated IDs)
                const employeesWithSettings = empList.map((emp) => {
                    const empSetting = settingsList.find(
                        (s) => s.EmployeeID === emp._id || (s.EmployeeID && s.EmployeeID._id === emp._id)
                    );
                    return {
                        ...emp,
                        salarySettings: empSetting || null
                    };
                });

                setEmployees(employeesWithSettings);
                setSalaryHeads(heads || []);
                setSalarySettings(settingsList);
            } else if (activeTab === 'payslips') {
                await loadPayslipData();
            } else if (activeTab === 'notifications') {
                const res = await getHRNotifications();
                if (res.success) {
                    setNotifications(res.data);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, targetCompanyId, selectedMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load payslip data and distribution
    const loadPayslipData = useCallback(async () => {
        if (!targetCompanyId) return;
        setLoading(true);
        try {
            // Distribution summary
            try {
                const distRes = await getTotalSalaryDistribution(selectedMonth, targetCompanyId);
                console.log("Distribution response:", distRes);
                // Backend returns { success: true, data: { totalGrossSalary, totalDeductions, totalTaxes } }
                if (distRes && distRes.success && distRes.data) {
                    setDistribution(distRes.data);  // Extract the actual data
                } else if (distRes && distRes.totalGrossSalary !== undefined) {
                    // Fallback if data is returned directly
                    setDistribution(distRes);
                } else {
                    setDistribution(null);
                }
            } catch (err) {
                console.error('Failed to load distribution:', err);
                setDistribution(null);
            }

            // Employees and settings
            const [empRes, settings] = await Promise.all([
                getAllEmployees(targetCompanyId),
                getSalarySettings(targetCompanyId)
            ]);
            const empList = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);
            const settingsList = settings || [];

            // Merge employee data with salary settings (handle populated and unpopulated IDs)
            const employeesWithSettings = empList.map((emp) => {
                const empSetting = settingsList.find(
                    (s) => s.EmployeeID === emp._id || (s.EmployeeID && s.EmployeeID._id === emp._id)
                );
                return {
                    ...emp,
                    salarySettings: empSetting || null
                };
            });

            setEmployees(employeesWithSettings);

            // FIXED: Do NOT auto-calculate slips on tab load!
            // Just clear the generated slips - user must click "Generate" button
            setGeneratedSlips({});

        } catch (error) {
            console.error('Failed to load payslip data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, targetCompanyId]);

    // Generate payslips for all employees (server does processing)
    const handleGeneratePayslips = async () => {
        if (!selectedMonth) {
            alert('Please select a month');
            return;
        }
        setGenerating(true);
        try {
            const result = await calculateSalaryForAll(selectedMonth, targetCompanyId);
            if (result && result.success) {
                alert(
                    `Payslips generated successfully!\nProcessed: ${result.processedCount}\nSkipped: ${result.skippedCount}`
                );
                await loadPayslipData();
            } else {
                alert(result?.message || 'Failed to generate payslips');
            }
        } catch (error) {
            console.error('Failed to generate payslips:', error);
            alert('Failed to generate payslips: ' + (error?.response?.data?.message || error?.message || error));
        } finally {
            setGenerating(false);
        }
    };

    // Generate payslip for individual employee
    const handleGenerateIndividualPayslip = async (employeeId, employeeName) => {
        if (!selectedMonth) {
            alert('Please select a month first');
            return;
        }
        const confirmGenerate = window.confirm(`Generate salary slip for ${employeeName} for ${selectedMonth}?`);
        if (!confirmGenerate) return;
        setGenerating(true);
        try {
            const result = await calculateSalaryDetailed(employeeId, selectedMonth, targetCompanyId);
            if (result && result.success) {
                setGeneratedSlips((prev) => ({
                    ...prev,
                    [employeeId]: result.data
                }));
                alert(
                    `Salary slip generated successfully for ${employeeName}!\n\nGross Salary: ₹${(result.data?.grossSalary || 0).toLocaleString()}\nDeductions: ₹${(result.data?.totalDeductions || 0).toLocaleString()}\nNet Salary: ₹${(result.data?.netSalary || 0).toLocaleString()}`
                );
                await loadPayslipData();
            } else if (result && result.data && (result.data.grossSalary !== undefined || result.data.Earnings)) {
                // slip exists on server; store returned data
                const slip = result.data;
                setGeneratedSlips((prev) => ({
                    ...prev,
                    [employeeId]: slip
                }));
                alert(
                    `Salary slip already exists for ${employeeName}!\n\nGross Salary: ₹${(slip.grossSalary || 0).toLocaleString()}\nDeductions: ₹${(slip.totalDeductions || 0).toLocaleString()}\nTax: ₹${(slip.TaxAmount || 0).toLocaleString()}\nNet Salary: ₹${(slip.netSalary || 0).toLocaleString()}`
                );
            } else {
                alert(result?.message || 'Failed to generate salary slip');
            }
        } catch (error) {
            console.error('Failed to generate payslip:', error);
            alert('Failed to generate payslip: ' + (error?.response?.data?.message || error?.message || error));
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPayslip = async (employeeId) => {
        try {
            const blob = await generatePayslipPDF(employeeId, selectedMonth);
            // If API returns response blob directly:
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip-${selectedMonth}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download payslip:', error);
            alert('Failed to download payslip');
        }
    };

    const handleConfigureClick = (employee) => {
        setSelectedEmployee(employee);
        setIsConfigureModalOpen(true);
    };

    const handleSaveSalaryConfiguration = async (data) => {
        try {
            const response = await addOrUpdateSalarySetting({ ...data, CompanyId: targetCompanyId });

            if (response.data && response.data.success === false) {
                alert(response.data.message || 'Operation failed');
                return;
            }

            if (response.data?.isRequest) {
                alert('Salary configuration request sent to Admin for approval.');
            } else {
                alert('Salary configuration saved successfully!');
            }

            setIsConfigureModalOpen(false);
            setSelectedEmployee(null);
            // Refresh relevant data regardless of current tab
            await loadData();
        } catch (error) {
            console.error('Failed to save salary configuration:', error);
            alert('Failed to save salary configuration: ' + (error?.response?.data?.message || error?.message || error));
        }
    };

    const handleDeleteSalaryConfiguration = async (employeeId, employeeName, salarySettingId) => {
        if (!salarySettingId) {
            alert('No salary configuration found to delete');
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the salary configuration for ${employeeName}?\n\nThis action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            await deleteSalarySetting(salarySettingId);
            alert('Salary configuration deleted successfully!');
            // Refresh data
            await loadData();
        } catch (error) {
            console.error('Failed to delete salary configuration:', error);
            alert('Failed to delete salary configuration: ' + (error?.response?.data?.message || error?.message || error));
        }
    };

    const toggleSlipExpand = (empId) => {
        setExpandedSlip((prev) => (prev === empId ? null : empId));
    };

    const handleAddSalaryHead = async (data) => {
        try {
            await addSalaryHead(data, targetCompanyId);
            alert('Salary head added successfully!');
            loadData();
        } catch (error) {
            console.error('Failed to add salary head:', error);
            alert('Failed to add salary head');
        }
    };

    const handleDeleteSalaryHead = async (id) => {
        if (!window.confirm('Are you sure you want to delete this salary head?')) return;
        try {
            await deleteSalaryHead(id, targetCompanyId);
            alert('Salary head deleted successfully!');
            loadData();
        } catch (error) {
            console.error('Failed to delete salary head:', error);
            alert('Failed to delete salary head');
        }
    };

    // Helpers
    const hasConfiguration = (emp) => {
        return emp?.salarySettings && Array.isArray(emp.salarySettings.SalaryHeads) && emp.salarySettings.SalaryHeads.length > 0;
    };

    const hasPendingRequest = (empId) => {
        return pendingRequests.some(req => req.EmployeeID?._id === empId || req.EmployeeID === empId);
    };

    const calculateTotals = (settings) => {
        if (!settings || !Array.isArray(settings.SalaryHeads)) return { earnings: 0, deductions: 0, net: 0 };
        let earnings = 0;
        let deductions = 0;

        settings.SalaryHeads.forEach((head) => {
            const amount = Number(head.applicableValue ?? head.Amount ?? 0) || 0;
            const headInfo = head.SalaryHeadId;

            // Backend populates: HeadType | Frontend schema uses: SalaryHeadsType
            const headType = headInfo?.HeadType || headInfo?.SalaryHeadsType || 'Earnings';

            if (headType === 'Deductions' || headType === 'deductions') {
                deductions += amount;
            } else {
                // Default to earnings (includes Basic, HRA, Allowances, etc.)
                earnings += amount;
            }
        });

        return { earnings, deductions, net: earnings - deductions };
    };

    const getHeadName = (head) => {
        // Backend populates: HeadName | Frontend schema uses: SalaryHeadsTitle
        return head?.SalaryHeadId?.HeadName || head?.SalaryHeadId?.SalaryHeadsTitle || 'Unknown';
    };

    const getHeadType = (head) => {
        // Backend populates: HeadType | Frontend schema uses: SalaryHeadsType
        return head?.SalaryHeadId?.HeadType || head?.SalaryHeadId?.SalaryHeadsType;
    };

    const tabs = [
        { id: 'salary-heads', label: 'Salary Heads', icon: <MdAttachMoney size={20} /> },
        { id: 'salary-settings', label: 'Salary Settings', icon: <MdSettings size={20} /> },
        { id: 'payslips', label: 'Payslip Management', icon: <MdReceipt size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <MdNotifications size={20} /> }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Salary Management</h2>
                <p className="text-gray-500 dark:text-gray-400">Manage salary heads, configure employee salaries, and view payslips</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                {/* Salary Heads Tab */}
                {activeTab === 'salary-heads' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salary Heads</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage salary components like Basic, HRA, TA, etc.</p>
                            </div>
                            <button
                                onClick={() => setIsAddSalaryHeadModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <MdAttachMoney />
                                Add Salary Head
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : salaryHeads.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No salary heads defined yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {salaryHeads.map((head) => (
                                    <div key={head._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{head.SalaryHeadsTitle}</h4>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">({head.ShortName})</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSalaryHead(head._id)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                title="Delete Salary Head"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                                <span
                                                    className={`font-medium ${head.SalaryHeadsType === 'Earnings' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                        }`}
                                                >
                                                    {head.SalaryHeadsType}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Method:</span>
                                                <span className="text-gray-900 dark:text-white">{head.SalaryCalcultateMethod}</span>
                                            </div>
                                            {head.DependOn && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Depends On:</span>
                                                    <span className="text-gray-900 dark:text-white">{head.DependOn}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Salary Settings Tab */}
                {activeTab === 'salary-settings' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Salary Configuration</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure salary structure for each employee</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No employees found. Add employees first.</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Total Employees: {employees.length}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {employees.map((emp) => (
                                        <div key={emp._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{emp.Name}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{emp.Email}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {emp.Department} - {emp.Designation}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleConfigureClick(emp)}
                                                        disabled={hasPendingRequest(emp._id)}
                                                        className={`px-3 py-1 text-sm text-white rounded ${hasPendingRequest(emp._id)
                                                            ? 'bg-yellow-500 cursor-not-allowed'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        {hasPendingRequest(emp._id) ? 'Request Sent' : 'Configure'}
                                                    </button>
                                                    {emp.salarySettings && (
                                                        <button
                                                            onClick={() => handleDeleteSalaryConfiguration(emp._id, emp.Name, emp.salarySettings._id)}
                                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                                                            title="Delete salary configuration"
                                                        >
                                                            <MdDelete size={16} />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Payslips Tab */}
                {activeTab === 'payslips' && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payslip Management</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Generate and view employee payslips</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div>
                                    <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Month:</label>
                                    <input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="border dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <button
                                    onClick={handleGeneratePayslips}
                                    disabled={generating}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    <MdRefresh className={generating ? 'animate-spin' : ''} />
                                    {generating ? 'Generating...' : 'Generate Payslips'}
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        {distribution && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Gross Salary</p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">₹{(distribution.totalGrossSalary || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                    <p className="text-sm text-red-600 dark:text-red-400">Total Deductions</p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">₹{(distribution.totalDeductions || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                                    <p className="text-sm text-orange-600 dark:text-orange-400">Total Taxes</p>
                                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">₹{(distribution.totalTaxes || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                    <p className="text-sm text-green-600 dark:text-green-400">Net Payable</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        ₹{(((distribution.totalGrossSalary || 0) - (distribution.totalDeductions || 0) - (distribution.totalTaxes || 0)) || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Employee List */}
                        {loading ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No employees found.</div>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Employee Salary Details</h4>

                                {employees.map((emp) => (
                                    <div key={emp._id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer" onClick={() => toggleSlipExpand(emp._id)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                                    {emp.Name?.charAt(0) || 'E'}
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-900 dark:text-white">{emp.Name}</h5>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{emp.Department} - {emp.Designation}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {hasConfiguration(emp) ? (
                                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">Configured</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded">Not Configured</span>
                                                )}
                                                {expandedSlip === emp._id ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                                            </div>
                                        </div>

                                        {/* Expanded content */}
                                        {expandedSlip === emp._id && (
                                            <div className="p-4 border-t dark:border-gray-700">
                                                {hasConfiguration(emp) ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Earnings */}
                                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                                                <h6 className="font-medium text-green-700 dark:text-green-300 mb-3">Earnings</h6>
                                                                <div className="space-y-2">
                                                                    {(generatedSlips[emp._id]?.Earnings?.length > 0) ? (
                                                                        generatedSlips[emp._id].Earnings.map((earn, idx) => (
                                                                            <div key={idx} className="flex justify-between text-sm">
                                                                                <span className="text-gray-600 dark:text-gray-400">{earn.title} ({earn.shortName})</span>
                                                                                <span className="text-gray-900 dark:text-white font-medium">₹{(earn.amount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                        ))
                                                                    ) : emp.salarySettings?.SalaryHeads?.filter(h => getHeadType(h) === 'Earnings').length > 0 ? (
                                                                        emp.salarySettings.SalaryHeads.filter(h => getHeadType(h) === 'Earnings').map((head, idx) => (
                                                                            <div key={idx} className="flex justify-between text-sm">
                                                                                <span className="text-gray-600 dark:text-gray-400">{getHeadName(head)}</span>
                                                                                <span className="text-gray-900 dark:text-white font-medium">₹{(head.applicableValue || head.Amount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">No earnings configured</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Deductions */}
                                                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                                                <h6 className="font-medium text-red-700 dark:text-red-300 mb-3">Deductions</h6>
                                                                <div className="space-y-2">
                                                                    {(generatedSlips[emp._id]?.Deductions?.length > 0) ? (
                                                                        generatedSlips[emp._id].Deductions.map((ded, idx) => (
                                                                            <div key={idx} className="flex justify-between text-sm">
                                                                                <span className="text-gray-600 dark:text-gray-400">{ded.title} ({ded.shortName})</span>
                                                                                <span className="text-gray-900 dark:text-white font-medium">₹{(ded.amount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                        ))
                                                                    ) : emp.salarySettings?.SalaryHeads?.filter(h => getHeadType(h) === 'Deductions').length > 0 ? (
                                                                        emp.salarySettings.SalaryHeads.filter(h => getHeadType(h) === 'Deductions').map((head, idx) => (
                                                                            <div key={idx} className="flex justify-between text-sm">
                                                                                <span className="text-gray-600 dark:text-gray-400">{getHeadName(head)}</span>
                                                                                <span className="text-gray-900 dark:text-white font-medium">₹{(head.applicableValue || head.Amount || 0).toLocaleString()}</span>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">No deductions</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Summary */}
                                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                                            {generatedSlips[emp._id] ? (
                                                                <>
                                                                    <div className="mb-3 text-center">
                                                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">
                                                                            ✓ Slip Generated for {selectedMonth}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-4 gap-4 text-center">
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Gross Salary</p>
                                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(generatedSlips[emp._id].grossSalary || 0).toLocaleString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Deductions</p>
                                                                            <p className="text-xl font-bold text-red-600 dark:text-red-400">-₹{(generatedSlips[emp._id].totalDeductions || 0).toLocaleString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Tax</p>
                                                                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">-₹{(generatedSlips[emp._id].TaxAmount || 0).toLocaleString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Net Salary</p>
                                                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{(generatedSlips[emp._id].netSalary || 0).toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="mb-3 text-center">
                                                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded">
                                                                            Click "Generate Payslip" to calculate salary
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-4 text-center">
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Gross Salary</p>
                                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{calculateTotals(emp.salarySettings).earnings.toLocaleString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Deductions</p>
                                                                            <p className="text-xl font-bold text-red-600 dark:text-red-400">-₹{calculateTotals(emp.salarySettings).deductions.toLocaleString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Net Salary</p>
                                                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{calculateTotals(emp.salarySettings).net.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleConfigureClick(emp)}
                                                                className="px-4 py-2 text-sm border dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                Edit Configuration
                                                            </button>
                                                            <button
                                                                onClick={() => handleGenerateIndividualPayslip(emp._id, emp.Name)}
                                                                disabled={generating}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                <MdPlayArrow />
                                                                {generating ? 'Generating...' : 'Generate Payslip'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadPayslip(emp._id)}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            >
                                                                <MdDownload />
                                                                Download Payslip
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6">
                                                        <p className="text-gray-500 dark:text-gray-400 mb-4">Salary not configured for this employee</p>
                                                        <div className="flex justify-center gap-3">
                                                            <button onClick={() => handleConfigureClick(emp)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                                Configure Salary
                                                            </button>
                                                            <button
                                                                onClick={() => handleGenerateIndividualPayslip(emp._id, emp.Name)}
                                                                disabled={generating}
                                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                <MdPlayArrow />
                                                                {generating ? 'Generating...' : 'Generate Payslip'}
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-orange-500 mt-2">Note: Salary must be configured before generating payslip</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Notifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Updates on your salary configuration requests</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No new notifications.</div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((notif) => (
                                    <div key={notif._id} className={`p-4 border rounded-lg flex justify-between items-start ${notif.IsRead ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'}`}>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{notif.EmployeeID?.Name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Request for salary configuration was <span className={`font-bold ${notif.Status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>{notif.Status}</span>
                                            </p>
                                            {notif.Status === 'Rejected' && notif.RejectionReason && (
                                                <p className="text-sm text-red-500 mt-1">Reason: {notif.RejectionReason}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">{new Date(notif.updatedAt).toLocaleString()}</p>
                                        </div>
                                        {!notif.IsRead && (
                                            <button
                                                onClick={async () => {
                                                    await markNotificationRead(notif._id);
                                                    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, IsRead: true } : n));
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Configure Salary Modal */}
            <ConfigureSalaryModal
                open={isConfigureModalOpen}
                onClose={() => {
                    setIsConfigureModalOpen(false);
                    setSelectedEmployee(null);
                }}
                employee={selectedEmployee}
                salaryHeads={salaryHeads}
                onSave={handleSaveSalaryConfiguration}
            />

            {/* Add Salary Head Modal */}
            <AddSalaryHeadModal
                open={isAddSalaryHeadModalOpen}
                onClose={() => setIsAddSalaryHeadModalOpen(false)}
                onAdd={handleAddSalaryHead}
            />
        </div>
    );
}
