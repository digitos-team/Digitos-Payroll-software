import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
    MdPerson,
    MdBusiness,
    MdWork,
    MdLocationOn,
    MdRefresh,
    MdInfo,
    MdPeople,
    MdAccountBalance
} from "react-icons/md";
import { getUserById, getEmployeeCount } from "../utils/api/EmployeeApi";
import { getDepartmentsByCompany, getDepartmentCount, getDesignationsByCompany } from "../utils/api/DepartmentApi";
import { getBranchesByCompany, getBranchCount, getBranchWiseMonthlyPayroll } from "../utils/api/BranchApi";

import { fetchSalaryHeads } from "../../../utils/api/salaryheads";
import { getSalarySettings } from "../utils/api/SalaryAPi";
import { fetchHRProfile, updateHRProfile } from "../utils/api/HRApi";
import EditHRProfileModal from "../components/Modals/EditHRProfileModal";
import { MdEdit } from "react-icons/md";
import { getAssetUrl } from "../../../utils/config";

export default function HRSettings() {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('hr-details');

    // Data states
    const [hrUserData, setHrUserData] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [branchPayrollData, setBranchPayrollData] = useState([]);
    const [salaryHeads, setSalaryHeads] = useState([]);
    const [salarySettings, setSalarySettings] = useState([]);

    const [employeeCount, setEmployeeCount] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Counts
    const [counts, setCounts] = useState({
        employees: 0,
        departments: 0,
        branches: 0,
        designations: 0
    });

    const { companyId: reduxCompanyId, user } = useSelector((state) => state.auth || {});
    const targetCompanyId = reduxCompanyId?._id || reduxCompanyId;
    const currentUserId = user?._id || user?.id;

    console.log("HRSettings - Redux user:", user);
    console.log("HRSettings - currentUserId:", currentUserId);

    const loadAllData = useCallback(async () => {
        if (!targetCompanyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Fetch all data with individual error handling

            const results = await Promise.allSettled([
                fetchHRProfile(),
                getDepartmentsByCompany(targetCompanyId),
                getBranchesByCompany(targetCompanyId),
                getDesignationsByCompany(targetCompanyId),
                fetchSalaryHeads(targetCompanyId),
                getSalarySettings(targetCompanyId),
                getEmployeeCount(targetCompanyId),
                getDepartmentCount(targetCompanyId),
                getBranchCount(targetCompanyId),
                getBranchWiseMonthlyPayroll(targetCompanyId, selectedMonth),
                currentUserId ? getUserById(currentUserId) : Promise.resolve(null)
            ]);

            // Extract results safely
            const userResult = results[0];
            const deptRes = results[1].status === 'fulfilled' ? results[1].value : null;
            const branchRes = results[2].status === 'fulfilled' ? results[2].value : null;
            const desigRes = results[3].status === 'fulfilled' ? results[3].value : null;
            const salaryHeadsRes = results[4].status === 'fulfilled' ? results[4].value : null;
            const salarySettingsRes = results[5].status === 'fulfilled' ? results[5].value : null;
            const empCountRes = results[6].status === 'fulfilled' ? results[6].value : null;
            const deptCountRes = results[7].status === 'fulfilled' ? results[7].value : null;

            const branchCountRes = results[8].status === 'fulfilled' ? results[8].value : null;
            const branchPayrollRes = results[9].status === 'fulfilled' ? results[9].value : null;
            const userByIdRes = results[10].status === 'fulfilled' ? results[10].value : null;

            // Process HR user data
            let userData = null;

            if (userResult.status === 'fulfilled') {
                const val = userResult.value;
                userData = val?.user || val?.data || (val?.Name ? val : null);
                console.log("HRSettings - fetchHRProfile success:", userData);
            } else {
                console.error("HRSettings - fetchHRProfile failed:", userResult.reason);
            }

            // Fallback to getUserById if fetchHRProfile failed
            if (!userData && userByIdRes) {
                const val = userByIdRes.data;
                // userById returns { data: { ... } } or { data: null }
                userData = val || (val?.Name ? val : null);
                console.log("HRSettings - Falling back to getUserById result:", userData);
            }

            if (!userData && user) {
                console.log("HRSettings - Falling back to Redux user data");
                userData = user;
            }
            setHrUserData(userData);

            // Process departments - handle nested response like other pages
            const deptList = deptRes?.data?.data || deptRes?.data || [];
            setDepartments(Array.isArray(deptList) ? deptList : []);

            // Process branches - handle nested response like other pages
            const branchList = branchRes?.data?.data || branchRes?.data || [];
            setBranches(Array.isArray(branchList) ? branchList : []);

            // Process branch payroll data
            const payrollData = Array.isArray(branchPayrollRes) ? branchPayrollRes : (branchPayrollRes?.data || []);
            setBranchPayrollData(Array.isArray(payrollData) ? payrollData : []);

            // Process designations - handle nested response like other pages
            const desigList = desigRes?.data?.data || desigRes?.data || [];
            setDesignations(Array.isArray(desigList) ? desigList : []);

            // Process salary heads
            setSalaryHeads(salaryHeadsRes || []);

            // Process salary settings
            setSalarySettings(salarySettingsRes || []);

            // Set counts
            setEmployeeCount(empCountRes?.data?.total || 0);
            setCounts({
                employees: empCountRes?.data?.total || 0,
                departments: deptCountRes?.data?.count || (Array.isArray(deptList) ? deptList.length : 0),
                branches: branchCountRes?.data?.totalBranches || (Array.isArray(branchList) ? branchList.length : 0),
                designations: Array.isArray(desigList) ? desigList.length : 0
            });

        } catch (error) {
            console.error("Failed to load HR data:", error);
        } finally {
            setLoading(false);
        }
    }, [targetCompanyId, currentUserId, selectedMonth]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const sections = [
        { id: 'hr-details', label: 'HR Details', icon: <MdPerson size={20} /> },
        { id: 'overview', label: 'Overview', icon: <MdInfo size={20} /> },
        { id: 'departments', label: 'Departments', icon: <MdBusiness size={20} /> },
        { id: 'designations', label: 'Designations', icon: <MdWork size={20} /> },
        { id: 'branches', label: 'Branches', icon: <MdLocationOn size={20} /> },
        { id: 'salary', label: 'Salary Info', icon: <MdAccountBalance size={20} /> }
    ];

    const getConfiguredEmployeesCount = () => {
        return salarySettings.length;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">HR Settings</h2>
                    <p className="text-gray-500 dark:text-gray-400">View all HR information and configurations</p>
                </div>
                <button
                    onClick={loadAllData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <MdRefresh className={loading ? 'animate-spin' : ''} size={20} />
                    Refresh
                </button>
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
                        Loading HR data...
                    </div>
                ) : (
                    <>
                        {/* HR Details Section */}
                        {activeSection === 'hr-details' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">HR Information</h3>

                                {!hrUserData ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <MdPerson className="mx-auto mb-2" size={48} />
                                        No HR user data found.
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* 1. Personal & Profile Header */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                            <div className="flex flex-col md:flex-row items-center gap-6">
                                                <div className="flex-shrink-0">
                                                    {hrUserData.ProfilePhoto ? (
                                                        <img
                                                            src={hrUserData.ProfilePhoto}
                                                            alt={hrUserData.Name}
                                                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 shadow-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-32 h-32 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center border-4 border-gray-100 dark:border-gray-700 shadow-lg">
                                                            <span className="text-4xl font-bold text-white">
                                                                {hrUserData.Name?.charAt(0)?.toUpperCase() || 'H'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-center md:text-left">
                                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                        {hrUserData.Name || 'N/A'}
                                                    </h2>
                                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
                                                            {hrUserData.Role || 'HR'}
                                                        </span>
                                                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                            {hrUserData.EmployeeCode ? `ID: ${hrUserData.EmployeeCode}` : ''}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditModalOpen(true)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        <MdEdit size={16} />
                                                        Edit Profile
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Basic Info Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t dark:border-gray-700">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                                    <p className="font-medium text-gray-900 dark:text-white break-all">{hrUserData.Email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">{hrUserData.Phone || hrUserData.PhoneNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Joining Date</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {hrUserData.JoiningDate
                                                            ? new Date(hrUserData.JoiningDate).toLocaleDateString()
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* 2. Employment Details */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Employment Details</h4>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {departments.find(d => d._id === hrUserData.DepartmentId)?.DepartmentName ||
                                                                    hrUserData.DepartmentId?.DepartmentName || // if populated
                                                                    'Not Assigned'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Designation</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {designations.find(d => d._id === hrUserData.DesignationId)?.DesignationName ||
                                                                    hrUserData.DesignationId?.DesignationName ||
                                                                    'Not Assigned'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Branch</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {branches.find(b => b._id === hrUserData.BranchId)?.BranchName ||
                                                                    hrUserData.BranchId?.BranchName ||
                                                                    'Not Assigned'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {hrUserData.DateOfBirth
                                                                    ? new Date(hrUserData.DateOfBirth).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Identity Details */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Identity Details</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Adhaar Number</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.AdhaarNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">PAN Number</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.PANNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Bank Details */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Bank Details</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank Name</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.BankDetails?.BankName || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Holder</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.BankDetails?.AccountHolderName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Number</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.BankDetails?.AccountNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">IFSC Code</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.BankDetails?.IFSCCode || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bank Branch</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">{hrUserData.BankDetails?.BranchName || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 5. Documents */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Documents</h4>
                                                <div className="space-y-4">
                                                    {['AdhaarCard', 'PANCard', 'BankPassbook'].map((docKey) => {
                                                        const doc = hrUserData.Documents?.[docKey];
                                                        return (
                                                            <div key={docKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded text-blue-600 dark:text-blue-400">
                                                                        <MdInfo size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                            {docKey.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {doc?.filename ? doc.filename : 'Not uploaded'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {doc?.filepath && (
                                                                    <a
                                                                        href={getAssetUrl(doc.filepath)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                                                    >
                                                                        View
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Marksheets separate handling because it is an array */}
                                                    {hrUserData.Documents?.Marksheets?.length > 0 && (
                                                        <div className="mt-4">
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marksheets</p>
                                                            <div className="space-y-2">
                                                                {hrUserData.Documents.Marksheets.map((mark, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded text-purple-600 dark:text-purple-400">
                                                                                <MdWork size={18} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                    {mark.documentType || 'Marksheet'}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {mark.filename}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {mark.filepath && (
                                                                            <a
                                                                                href={getAssetUrl(mark.filepath)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                                                                            >
                                                                                View
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Other Documents separate handling */}
                                                    {hrUserData.Documents?.OtherDocuments?.length > 0 && (
                                                        <div className="mt-4">
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Other Documents</p>
                                                            <div className="space-y-2">
                                                                {hrUserData.Documents.OtherDocuments.map((doc, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded text-indigo-600 dark:text-indigo-400">
                                                                                <MdInfo size={18} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                    {doc.documentType || 'Document'}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {doc.filename}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {doc.filepath && (
                                                                            <a
                                                                                href={getAssetUrl(doc.filepath)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                                                            >
                                                                                View
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overview Section */}
                        {activeSection === 'overview' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">HR Overview</h3>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
                                                <MdPeople className="text-blue-600 dark:text-blue-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.employees}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
                                                <MdBusiness className="text-green-600 dark:text-green-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Departments</p>
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.departments}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-lg">
                                                <MdWork className="text-purple-600 dark:text-purple-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Designations</p>
                                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{counts.designations}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-lg">
                                                <MdLocationOn className="text-orange-600 dark:text-orange-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Branches</p>
                                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{counts.branches}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border dark:border-gray-700 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Salary Configuration</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Total Salary Heads</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{salaryHeads.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Employees with Salary Configured</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{getConfiguredEmployeesCount()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Pending Configuration</span>
                                                <span className="font-medium text-orange-600 dark:text-orange-400">
                                                    {counts.employees - getConfiguredEmployeesCount()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border dark:border-gray-700 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Stats</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Earning Heads</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {salaryHeads.filter(h => h.SalaryHeadsType === 'Earnings').length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Deduction Heads</span>
                                                <span className="font-medium text-red-600 dark:text-red-400">
                                                    {salaryHeads.filter(h => h.SalaryHeadsType === 'Deductions').length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Departments Section */}
                        {activeSection === 'departments' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Departments</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total: {departments.length}</span>
                                </div>

                                {departments.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No departments found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {departments.map((dept) => (
                                            <div key={dept._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                                                        <MdBusiness className="text-green-600 dark:text-green-400" size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{dept.DepartmentName}</h4>
                                                        {dept.Description && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{dept.Description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Designations Section */}
                        {activeSection === 'designations' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Designations</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total: {designations.length}</span>
                                </div>

                                {designations.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No designations found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {designations.map((desig) => (
                                            <div key={desig._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                                                        <MdWork className="text-purple-600 dark:text-purple-400" size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{desig.DesignationName}</h4>
                                                        {desig.Department && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Dept: {desig.Department}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Branches Section */}
                        {activeSection === 'branches' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Branches</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total: {branches.length}</span>
                                </div>

                                {branches.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No branches found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {branches.map((branch) => (
                                            <div key={branch._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                                                        <MdLocationOn className="text-orange-600 dark:text-orange-400" size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{branch.BranchName}</h4>
                                                        {branch.Address && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{branch.Address}</p>
                                                        )}
                                                        {branch.City && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{branch.City}, {branch.State}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Salary Info Section */}
                        {activeSection === 'salary' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salary Information</h3>

                                {/* Salary Heads */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Configured Salary Heads</h4>
                                    {salaryHeads.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">No salary heads configured.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {salaryHeads.map((head) => (
                                                <div key={head._id} className="border dark:border-gray-700 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="font-medium text-gray-900 dark:text-white">{head.SalaryHeadsTitle}</h5>
                                                        <span className={`px-2 py-1 text-xs rounded ${head.SalaryHeadsType === 'Earnings'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                            }`}>
                                                            {head.SalaryHeadsType}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                                        <p>Short Name: {head.ShortName}</p>
                                                        <p>Method: {head.SalaryCalcultateMethod}</p>
                                                        {head.DependOn && <p>Depends On: {head.DependOn}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Salary Configuration Status */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Employee Salary Configuration Status</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="font-medium text-green-700 dark:text-green-300">Configured</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{getConfiguredEmployeesCount()}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">employees with salary setup</p>
                                        </div>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                <span className="font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
                                            </div>
                                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                {counts.employees - getConfiguredEmployeesCount()}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">employees need configuration</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <EditHRProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                hrData={hrUserData}
                onUpdate={async (formData) => {
                    await updateHRProfile(formData);
                    loadAllData(); // Refresh data after update
                }}
            />
        </div >
    );
}
