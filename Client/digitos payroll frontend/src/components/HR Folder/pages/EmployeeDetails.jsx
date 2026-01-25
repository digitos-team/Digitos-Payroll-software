import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiCreditCard, FiFileText, FiDownload } from "react-icons/fi";
import { getUserById } from "../utils/api/EmployeeApi";

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const { data } = await getUserById(id);
                setEmployee(data);
            } catch (err) {
                console.error("Error fetching employee details:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEmployee();
        }
    }, [id]);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading employee details...</div>;
    }

    if (!employee) {
        return <div className="p-6 text-center text-red-500">Employee not found</div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate("/hr/employees")}
                className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
            >
                <FiArrowLeft className="mr-2" /> Back to Directory
            </button>

            {/* Header Card */}
            <div className="bg-white shadow-lg rounded-2xl p-8 mb-6 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Profile Photo */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-md overflow-hidden shrink-0">
                    {employee.ProfilePhoto ? (
                        <img
                            src={`http://localhost:5000/${employee.ProfilePhoto.replace(/\\/g, "/")}`}
                            alt={employee.Name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = employee.Name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                            }}
                        />
                    ) : (
                        <span>
                            {employee.Name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                    )}
                </div>

                {/* Basic Info */}
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{employee.Name}</h1>
                    <p className="text-lg text-gray-500 font-medium mb-4">{employee.DesignationId?.DesignationName || "Designation Not Set"}</p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                            {employee.DepartmentId?.DepartmentName || "Department Not Set"}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${employee.role === "HR" ? "bg-orange-50 text-orange-700 border-orange-100" :
                            employee.role === "CA" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                "bg-green-50 text-green-700 border-green-100"
                            }`}>
                            {employee.role}
                        </span>
                        <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-sm font-medium border border-gray-200">
                            {employee.BranchId?.BranchName || "Branch Not Set"}
                        </span>
                        {employee.EmployeeType && (
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                                {employee.EmployeeType}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FiBriefcase className="mr-2 text-blue-500" /> Personal & Work Details
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                                <FiMail className="text-gray-400" /> {employee.Email}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                                <FiPhone className="text-gray-400" /> {employee.Phone}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Employee Code</span>
                            <span className="font-medium text-gray-800">{employee.EmployeeCode || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Joining Date</span>
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                                <FiCalendar className="text-gray-400" />
                                {employee.JoiningDate ? new Date(employee.JoiningDate).toLocaleDateString() : "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Date of Birth</span>
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                                <FiCalendar className="text-gray-400" />
                                {employee.DateOfBirth ? new Date(employee.DateOfBirth).toLocaleDateString() : "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">Aadhaar Number</span>
                            <span className="font-medium text-gray-800">{employee.AdhaarNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-500">PAN Number</span>
                            <span className="font-medium text-gray-800">{employee.PANNumber || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FiCreditCard className="mr-2 text-green-500" /> Bank Information
                    </h3>
                    {employee.BankDetails ? (
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Bank Name</span>
                                <span className="font-medium text-gray-800">{employee.BankDetails.BankName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Account Number</span>
                                <span className="font-medium text-gray-800">{employee.BankDetails.AccountNumber || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">IFSC Code</span>
                                <span className="font-medium text-gray-800">{employee.BankDetails.IFSCCode || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Account Holder</span>
                                <span className="font-medium text-gray-800">{employee.BankDetails.AccountHolderName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Branch Name</span>
                                <span className="font-medium text-gray-800">{employee.BankDetails.BranchName || "N/A"}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 italic py-4 text-center">No bank details available</div>
                    )}
                </div>

                {/* Documents Section */}
                <div className="bg-white shadow-md rounded-xl p-6 md:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FiFileText className="mr-2 text-purple-500" /> Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bank Passbook */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3">Bank Passbook</h4>
                            {employee.Documents?.BankPassbook?.filepath ? (
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <FiFileText className="text-blue-600" />
                                        <span className="text-sm text-gray-700">
                                            {employee.Documents.BankPassbook.filename || "Bank Passbook"}
                                        </span>
                                    </div>
                                    <a
                                        href={`http://localhost:5000/${employee.Documents.BankPassbook.filepath.replace(/\\/g, "/")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                    >
                                        <FiDownload /> View
                                    </a>
                                </div>
                            ) : (
                                <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">Not uploaded</div>
                            )}
                        </div>

                        {/* Aadhaar Card */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3">Aadhaar Card</h4>
                            {employee.Documents?.AdhaarCard?.filepath ? (
                                <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-2">
                                        <FiFileText className="text-orange-600" />
                                        <span className="text-sm text-gray-700">
                                            {employee.Documents.AdhaarCard.filename || "Aadhaar Card"}
                                        </span>
                                    </div>
                                    <a
                                        href={`http://localhost:5000/${employee.Documents.AdhaarCard.filepath.replace(/\\/g, "/")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-800 flex items-center gap-1 text-sm"
                                    >
                                        <FiDownload /> View
                                    </a>
                                </div>
                            ) : (
                                <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">Not uploaded</div>
                            )}
                        </div>

                        {/* PAN Card */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3">PAN Card</h4>
                            {employee.Documents?.PANCard?.filepath ? (
                                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                    <div className="flex items-center gap-2">
                                        <FiFileText className="text-indigo-600" />
                                        <span className="text-sm text-gray-700">
                                            {employee.Documents.PANCard.filename || "PAN Card"}
                                        </span>
                                    </div>
                                    <a
                                        href={`http://localhost:5000/${employee.Documents.PANCard.filepath.replace(/\\/g, "/")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
                                    >
                                        <FiDownload /> View
                                    </a>
                                </div>
                            ) : (
                                <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">Not uploaded</div>
                            )}
                        </div>

                        {/* Marksheets */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3">Marksheets</h4>
                            {employee.Documents?.Marksheets && employee.Documents.Marksheets.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {employee.Documents.Marksheets.map((marksheet, index) => (
                                        <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                                            <div className="flex items-center gap-2">
                                                <FiFileText className="text-green-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700">
                                                        {marksheet.filename || `Marksheet ${index + 1}`}
                                                    </span>
                                                    {marksheet.documentType && (
                                                        <span className="text-xs text-gray-500">{marksheet.documentType}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={`http://localhost:5000/${marksheet.filepath.replace(/\\/g, "/")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                                            >
                                                <FiDownload /> View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">No marksheets uploaded</div>
                            )}
                        </div>

                        {/* Other Documents */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3">Other Documents</h4>
                            {employee.Documents?.OtherDocuments && employee.Documents.OtherDocuments.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {employee.Documents.OtherDocuments.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100">
                                            <div className="flex items-center gap-2">
                                                <FiFileText className="text-purple-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-700">
                                                        {doc.filename || `Document ${index + 1}`}
                                                    </span>
                                                    {doc.documentType && (
                                                        <span className="text-xs text-gray-500">{doc.documentType}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={`http://localhost:5000/${doc.filepath.replace(/\\/g, "/")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm"
                                            >
                                                <FiDownload /> View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">No other documents uploaded</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetails;
