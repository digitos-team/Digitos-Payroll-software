import React from 'react';
import { FiX, FiUser, FiBriefcase, FiCreditCard, FiFileText, FiDownload } from 'react-icons/fi';

const EmployeeDetailsView = ({ employee, onClose }) => {
    if (!employee) return null;

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const getFileUrl = (path) => {
        if (!path) return "";
        if (typeof path !== 'string') {
            // Handle case where path is an object (e.g. from mongoose or file upload)
            if (path.path) return `http://localhost:5000/${path.path.replace(/\\/g, "/")}`;
            if (path.url) return path.url;
            return "";
        }
        return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
    };

    const StatusBadge = ({ value }) => (
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
            {value}
        </span>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl mx-auto p-0 overflow-hidden flex flex-col h-full max-h-full md:max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-start text-white shrink-0">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center overflow-hidden shrink-0">
                        {employee.ProfilePhoto ? (
                            <img
                                src={getFileUrl(employee.ProfilePhoto)}
                                alt={employee.Name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold">{employee.Name?.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{employee.Name}</h2>
                        <p className="opacity-90 flex items-center gap-2 text-sm mt-1">
                            {employee.role} • {employee.EmployeeType || 'N/A'} • {typeof employee.BranchId === 'object' ? employee.BranchId?.BranchName : 'Unknown Branch'}
                        </p>
                        <div className="flex gap-2 mt-3">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-md">
                                {employee.EmployeeCode || "No ID"}
                            </span>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-md">
                                {employee.Email}
                            </span>
                        </div>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        <FiX className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900 custom-scrollbar scroll-smooth">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Personal Info */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <FiUser className="text-blue-500" /> Personal Details
                        </h3>
                        <div className="space-y-3">
                            <DetailRow label="Full Name" value={employee.Name} />
                            <DetailRow label="Email" value={employee.Email} />
                            <DetailRow label="Phone" value={employee.Phone} />
                            <DetailRow label="Date of Birth" value={formatDate(employee.DateOfBirth)} />
                            <DetailRow label="Aadhaar Number" value={employee.AdhaarNumber} />
                            <DetailRow label="PAN Number" value={employee.PANNumber} />
                            <DetailRow label="Joining Date" value={formatDate(employee.JoiningDate)} />
                        </div>
                    </div>

                    {/* Job Info */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <FiBriefcase className="text-purple-500" /> Employment Details
                        </h3>
                        <div className="space-y-3">
                            <DetailRow label="Role" value={employee.role} />
                            <DetailRow label="Employee Code" value={employee.EmployeeCode} />
                            <DetailRow
                                label="Branch"
                                value={typeof employee.BranchId === 'object' ? employee.BranchId?.BranchName : employee.BranchId}
                            />
                            <DetailRow
                                label="Department"
                                value={typeof employee.DepartmentId === 'object' ? employee.DepartmentId?.DepartmentName : 'N/A'}
                            />
                            <DetailRow
                                label="Designation"
                                value={typeof employee.DesignationId === 'object' ? employee.DesignationId?.DesignationName : 'N/A'}
                            />
                            <DetailRow label="Employee Type" value={employee.EmployeeType} />
                            <DetailRow label="Salary Status" value={<StatusBadge value="Active" />} />
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <FiCreditCard className="text-green-500" /> Bank Information
                        </h3>
                        <div className="space-y-3">
                            <DetailRow label="Bank Name" value={employee.BankDetails?.BankName} />
                            <DetailRow label="Account Holder" value={employee.BankDetails?.AccountHolderName} />
                            <DetailRow label="Account Number" value={employee.BankDetails?.AccountNumber} />
                            <DetailRow label="IFSC Code" value={employee.BankDetails?.IFSCCode} />
                            <DetailRow label="Branch Name" value={employee.BankDetails?.BranchName} />
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <FiFileText className="text-orange-500" /> Documents
                        </h3>
                        <div className="space-y-3">
                            <DocLink label="Bank Passbook" path={employee.Documents?.BankPassbook} getUrl={getFileUrl} />
                            <DocLink label="Aadhaar Card" path={employee.Documents?.AdhaarCard || employee.Documents?.AadhaarCard} getUrl={getFileUrl} />
                            <DocLink label="PAN Card" path={employee.Documents?.PANCard} getUrl={getFileUrl} />

                            {employee.Documents?.Marksheets?.length > 0 && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Marksheets</p>
                                    <div className="flex flex-wrap gap-2">
                                        {employee.Documents.Marksheets.map((doc, idx) => (
                                            <DocPill key={idx} path={doc} index={idx + 1} type="Marksheet" getUrl={getFileUrl} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {employee.Documents?.OtherDocuments?.length > 0 && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Other Documents</p>
                                    <div className="flex flex-wrap gap-2">
                                        {employee.Documents.OtherDocuments.map((doc, idx) => (
                                            <DocPill key={idx} path={doc} index={idx + 1} type="Doc" getUrl={getFileUrl} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {onClose && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper Components (Not exported to keep main file clean usage)
const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-start text-sm border-b border-gray-50 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
        <span className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{label}</span>
        <span className="text-gray-800 dark:text-gray-200 font-medium text-right break-words max-w-[60%]">{value || <span className="text-gray-300 dark:text-gray-600">-</span>}</span>
    </div>
);

const DocLink = ({ label, path, getUrl }) => {
    if (!path) return null;
    return (
        <div className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded mb-1">
            <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
            <a
                href={getUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
            >
                <FiDownload /> View
            </a>
        </div>
    );
};

const DocPill = ({ path, index, type, getUrl }) => (
    <a
        href={getUrl(path)}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center gap-1"
    >
        <FiFileText /> {type} {index}
    </a>
);

export default EmployeeDetailsView;
