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
    MdDelete
} from 'react-icons/md';
import ConfigureSalaryModal from '../../HR Folder/components/Modals/ConfigureSalaryModal';
import AddSalaryHeadModal from '../components/Modals/AddSalaryHeadModal';
import { fetchSalaryHeads, addSalaryHead, deleteSalaryHead } from '../../../utils/api/salaryheads';
import {
    addOrUpdateSalarySetting,
    calculateSalaryForAll,
    calculateSalaryDetailed,
    previewSalary,
    exportMonthlySalaryCSV,
    getSalarySettings,
    generatePayslipPDF,
    getTotalSalaryDistribution,
    deleteSalarySetting,
    exportThreeMonthSalaryPDF
} from '../../HR Folder/utils/api/SalaryAPi';
import { getAllEmployees } from '../../HR Folder/utils/api/EmployeeApi';

export default function AdminSalarySettings() {
    const [activeTab, setActiveTab] = useState('salary-settings');
    const [salaryHeads, setSalaryHeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [salarySettings, setSalarySettings] = useState([]);
    const [generatedSlips, setGeneratedSlips] = useState({});
    const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
    const [isAddSalaryHeadModalOpen, setIsAddSalaryHeadModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [expandedSlip, setExpandedSlip] = useState(null);
    const [distribution, setDistribution] = useState(null);
    const [selectedRole, setSelectedRole] = useState('HR'); // Default role

    const { companyId: reduxCompanyId, user } = useSelector((state) => state.auth || {});
    const targetCompanyId = reduxCompanyId?._id || reduxCompanyId;
    const userRole = user?.role;

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // If user is HR, specifically only allow managing Employees
    useEffect(() => {
        if (userRole === 'HR') {
            setSelectedRole('Employee');
        }
    }, [userRole]);

    const loadData = useCallback(async () => {
        if (!targetCompanyId) return;
        setLoading(true);
        try {
            if (activeTab === 'salary-heads') {
                const heads = await fetchSalaryHeads(targetCompanyId);
                setSalaryHeads(heads || []);
            } else if (activeTab === 'salary-settings') {
                const [empRes, heads, settings] = await Promise.all([
                    getAllEmployees(targetCompanyId, selectedRole), // Pass selected role
                    fetchSalaryHeads(targetCompanyId),
                    getSalarySettings(targetCompanyId)
                ]);

                const empList = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);
                const settingsList = settings || [];

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
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, targetCompanyId, selectedMonth, selectedRole]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadPayslipData = useCallback(async () => {
        if (!targetCompanyId) return;
        setLoading(true);
        try {
            try {
                const distRes = await getTotalSalaryDistribution(selectedMonth, targetCompanyId);
                if (distRes && distRes.success && distRes.data) {
                    setDistribution(distRes.data);
                } else if (distRes && distRes.totalGrossSalary !== undefined) {
                    setDistribution(distRes);
                } else {
                    setDistribution(null);
                }
            } catch (err) {
                console.error('Failed to load distribution:', err);
                setDistribution(null);
            }

            const [empRes, settings] = await Promise.all([
                getAllEmployees(targetCompanyId, selectedRole),
                getSalarySettings(targetCompanyId)
            ]);
            const empList = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);
            const settingsList = settings || [];

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
            setGeneratedSlips({});

        } catch (error) {
            console.error('Failed to load payslip data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, targetCompanyId, selectedRole]);

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
                    `Salary slip generated successfully for ${employeeName}!`
                );
                await loadPayslipData();
            } else if (result && result.data) {
                const slip = result.data;
                setGeneratedSlips((prev) => ({
                    ...prev,
                    [employeeId]: slip
                }));
                alert(
                    `Salary slip already exists for ${employeeName}!`
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

    const handleDownloadThreeMonthForEmployee = async (employeeId, employeeName) => {
        if (!selectedMonth) {
            alert('Please select a month first');
            return;
        }
        try {
            const [year, month] = selectedMonth.split('-');
            const blob = await exportThreeMonthSalaryPDF(month, year, targetCompanyId, employeeId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${employeeName}_3month_${selectedMonth}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export 3-month PDF:', error);
            alert('Failed to export PDF: ' + (error?.response?.data?.message || error?.message || 'Error occurred'));
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
            alert('Salary configuration saved successfully!');

            setIsConfigureModalOpen(false);
            setSelectedEmployee(null);
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
            await loadData();
        } catch (error) {
            console.error('Failed to delete salary configuration:', error);
            alert('Failed to delete salary configuration: ' + (error?.response?.data?.message || error?.message || error));
        }
    };

    const toggleSlipExpand = async (empId) => {
        const isExpanding = expandedSlip !== empId;
        setExpandedSlip((prev) => (prev === empId ? null : empId));

        // Auto-preview when expanding
        if (isExpanding && !generatedSlips[empId]) {
            try {
                const result = await previewSalary(empId, selectedMonth, targetCompanyId);
                if (result && result.success && result.data) {
                    setGeneratedSlips((prev) => ({
                        ...prev,
                        [empId]: result.data
                    }));
                }
            } catch (error) {
                console.error('Failed to preview salary:', error);
            }
        }
    };

    const handleExportCSV = async () => {
        if (!selectedMonth) {
            alert('Please select a month first');
            return;
        }
        try {
            const blob = await exportMonthlySalaryCSV(selectedMonth, targetCompanyId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salary_report_${selectedMonth}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export CSV:', error);
            alert('Failed to export CSV: ' + (error?.response?.data?.message || error?.message || 'No salary data found for this month'));
        }
    };

    const handleExportThreeMonth = async () => {
        if (!selectedMonth) {
            alert('Please select a month first');
            return;
        }
        try {
            const [year, month] = selectedMonth.split('-');
            const blob = await exportThreeMonthSalaryPDF(month, year, targetCompanyId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salary_report_3month_${selectedMonth}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export 3-month PDF:', error);
            alert('Failed to export PDF: ' + (error?.response?.data?.message || error?.message || 'Error occurred'));
        }
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

    const hasConfiguration = (emp) => {
        return emp?.salarySettings && Array.isArray(emp.salarySettings.SalaryHeads) && emp.salarySettings.SalaryHeads.length > 0;
    };

    const calculateTotals = (settings) => {
        if (!settings || !Array.isArray(settings.SalaryHeads)) return { earnings: 0, deductions: 0, net: 0 };
        let earnings = 0;
        let deductions = 0;

        settings.SalaryHeads.forEach((head) => {
            const amount = Number(head.applicableValue ?? head.Amount ?? 0) || 0;
            const headInfo = head.SalaryHeadId;
            const headType = headInfo?.HeadType || headInfo?.SalaryHeadsType || 'Earnings';

            if (headType === 'Deductions' || headType === 'deductions') {
                deductions += amount;
            } else {
                earnings += amount;
            }
        });

        return { earnings, deductions, net: earnings - deductions };
    };

    const getHeadName = (head) => {
        return head?.SalaryHeadId?.HeadName || head?.SalaryHeadId?.SalaryHeadsTitle || 'Unknown';
    };

    const getHeadType = (head) => {
        return head?.SalaryHeadId?.HeadType || head?.SalaryHeadId?.SalaryHeadsType;
    };

    const tabs = [
        { id: 'salary-settings', label: 'Salary Configuration', icon: <MdSettings size={20} /> },
        { id: 'payslips', label: 'Payslip Management', icon: <MdReceipt size={20} /> },
        { id: 'salary-heads', label: 'Salary Heads', icon: <MdAttachMoney size={20} /> }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Salary Management</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage salaries for Employees, HR, and CA</p>
                </div>

                {/* Role Selector - Only show if user is NOT HR */}
                {userRole !== 'HR' && (
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Role:</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="HR">HR</option>
                            <option value="CA">CA</option>
                            <option value="Employee">Employee</option>
                        </select>
                    </div>
                )}
            </div>

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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                {activeTab === 'salary-heads' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salary Heads</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Master list of salary components</p>
                            </div>
                            <button
                                onClick={() => setIsAddSalaryHeadModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <MdAttachMoney />
                                Add Salary Head
                            </button>
                        </div>
                        {/* Reusing the grid of heads code */}
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
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                                <span className={`font-medium ${head.SalaryHeadsType === 'Earnings' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {head.SalaryHeadsType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'salary-settings' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRole} Salary Configuration</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure salary structure for each {selectedRole}</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No {selectedRole}s found.</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Total {selectedRole}s: {employees.length}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {employees.map((emp) => (
                                        <div key={emp._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{emp.Name}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{emp.Email}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {[emp.Department, emp.Designation].filter(Boolean).join(' - ')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleConfigureClick(emp)}
                                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Configure
                                                    </button>
                                                    {emp.salarySettings && (
                                                        <button
                                                            onClick={() => handleDeleteSalaryConfiguration(emp._id, emp.Name, emp.salarySettings._id)}
                                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
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

                {activeTab === 'payslips' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payslip Management</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Generate payslips for {selectedRole}s</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                />
                                <button
                                    onClick={handleGeneratePayslips}
                                    disabled={generating}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    <MdRefresh className={generating ? 'animate-spin' : ''} />
                                    {generating ? 'Generating...' : 'Generate Payslips'}
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <MdDownload />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Employee List for Payslips - Reuse existing list logic with expand */}
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : (
                            <div className="space-y-4">
                                {employees.map((emp) => (
                                    <div key={emp._id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer" onClick={() => toggleSlipExpand(emp._id)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                                    {emp.Name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-900 dark:text-white">{emp.Name}</h5>
                                                    <span className={`px-2 py-0.5 text-xs rounded ${hasConfiguration(emp) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {hasConfiguration(emp) ? 'Configured' : 'Not Configured'}
                                                    </span>
                                                </div>
                                            </div>
                                            {expandedSlip === emp._id ? <MdExpandLess size={24} /> : <MdExpandMore size={24} />}
                                        </div>

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

                                                        {/* Attendance Summary - only show when slip is generated */}
                                                        {generatedSlips[emp._id]?.attendanceSummary && (
                                                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                                                <h6 className="font-medium text-purple-700 dark:text-purple-300 mb-3">Attendance Summary</h6>
                                                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                                                    {/* <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Working Days</p>
                                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{generatedSlips[emp._id].attendanceSummary.totalWorkingDays || 0}</p>
                                                                    </div> */}
                                                                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
                                                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{generatedSlips[emp._id].attendanceSummary.presentDays || 0}</p>
                                                                    </div>
                                                                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Paid Leaves</p>
                                                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{generatedSlips[emp._id].attendanceSummary.paidLeaves || 0}</p>
                                                                    </div>
                                                                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Half Days</p>
                                                                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{generatedSlips[emp._id].attendanceSummary.halfDays || 0}</p>
                                                                    </div>
                                                                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Unpaid Leaves</p>
                                                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{generatedSlips[emp._id].attendanceSummary.unpaidLeaves || 0}</p>
                                                                    </div>
                                                                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Leave Deduction</p>
                                                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">₹{(generatedSlips[emp._id].attendanceSummary.leaveDeductionAmount || 0).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

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

                                                        <div className="flex justify-end gap-2 mt-4">
                                                            <button
                                                                onClick={() => handleGenerateIndividualPayslip(emp._id, emp.Name)}
                                                                disabled={generating}
                                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                <MdPlayArrow />
                                                                {generating ? 'Generating...' : 'Generate Slip'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadPayslip(emp._id)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                            >
                                                                <MdDownload />
                                                                Download PDF
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadThreeMonthForEmployee(emp._id, emp.Name)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                                            >
                                                                <MdDownload />
                                                                3-Month Report
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <p className="text-gray-500 dark:text-gray-400 mb-3">No salary configuration found for this employee.</p>
                                                        <button
                                                            onClick={() => handleConfigureClick(emp)}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                        >
                                                            Configure Now
                                                        </button>
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
            </div>

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

            <AddSalaryHeadModal
                open={isAddSalaryHeadModalOpen}
                onClose={() => setIsAddSalaryHeadModalOpen(false)}
                onAdd={handleAddSalaryHead}
            />
        </div>
    );
}
