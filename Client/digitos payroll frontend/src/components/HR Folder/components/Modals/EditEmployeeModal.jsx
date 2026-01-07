import React, { useState, useEffect } from "react";
import { FiUpload, FiX, FiFileText, FiPlus, FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";
import { useSelector } from "react-redux";
import { getBranchesByCompany } from "../../utils/api/BranchApi";
import { getDepartmentsByCompany } from "../../utils/api/DepartmentApi";
import { getDesignationsByCompany } from "../../utils/api/DepartmentApi";

export default function EditEmployeeModal({ open, onClose, onUpdate, employee }) {
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const { companyId } = useSelector((state) => state.auth);

    const actualCompanyId = companyId?._id || companyId;

    useEffect(() => {
        if (open && actualCompanyId) {
            const fetchData = async () => {
                try {
                    const [branchRes, deptRes, desigRes] = await Promise.all([
                        getBranchesByCompany(actualCompanyId),
                        getDepartmentsByCompany(actualCompanyId),
                        getDesignationsByCompany(actualCompanyId)
                    ]);

                    setBranches(branchRes.data?.data || branchRes.data || []);
                    setDepartments(deptRes.data?.data || deptRes.data || []);
                    setDesignations(desigRes.data?.data || desigRes.data || []);
                } catch (error) {
                    console.error("Error fetching dropdown data:", error);
                }
            };
            fetchData();
        }
    }, [open, actualCompanyId]);

    const [form, setForm] = useState({
        Name: "",
        Email: "",
        Phone: "",
        Password: "",
        role: "Employee",
        DepartmentId: "",
        DesignationId: "",
        BranchId: "",
        EmployeeCode: "",
        JoiningDate: "",
        DateOfBirth: "",
        AdhaarNumber: "", // FIXED: Single 'a' to match schema
        PANNumber: "",
        BankDetails: {
            BankName: "",
            AccountHolderName: "",
            AccountNumber: "",
            IFSCCode: "",
            BranchName: "",
        },
        ProfilePhoto: null,
        Documents: {
            BankPassbook: null,
            AdhaarCard: null, // FIXED: Single 'a' to match schema
            PANCard: null,
            Marksheets: [],
            OtherDocuments: [],
        },
    });

    const [showPassword, setShowPassword] = useState(false);

    // Populate form when employee prop changes
    useEffect(() => {
        if (employee) {
            setForm({
                Name: employee.Name || "",
                Email: employee.Email || "",
                Phone: employee.Phone || "",
                Password: "",
                role: employee.role || "Employee",
                DepartmentId: employee.DepartmentId?._id || employee.DepartmentId || "",
                DesignationId: employee.DesignationId?._id || employee.DesignationId || "",
                BranchId: employee.BranchId?._id || employee.BranchId || "",
                EmployeeCode: employee.EmployeeCode || "",
                JoiningDate: employee.JoiningDate ? employee.JoiningDate.split('T')[0] : "",
                DateOfBirth: employee.DateOfBirth ? employee.DateOfBirth.split('T')[0] : "",
                AdhaarNumber: employee.AdhaarNumber || "",
                PANNumber: employee.PANNumber || "",
                BankDetails: {
                    BankName: employee.BankDetails?.BankName || "",
                    AccountHolderName: employee.BankDetails?.AccountHolderName || "",
                    AccountNumber: employee.BankDetails?.AccountNumber || "",
                    IFSCCode: employee.BankDetails?.IFSCCode || "",
                    BranchName: employee.BankDetails?.BranchName || "",
                },
                ProfilePhoto: null,
                Documents: {
                    BankPassbook: null,
                    AdhaarCard: null,
                    PANCard: null,
                    Marksheets: [],
                    OtherDocuments: [],
                },
            });
        }
    }, [employee]);

    if (!open) return null;

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateBankField = (key, value) => {
        setForm((prev) => ({
            ...prev,
            BankDetails: { ...prev.BankDetails, [key]: value },
        }));
    };

    const submit = (e) => {
        e.preventDefault();

        // CRITICAL FIX: Convert to FormData for file uploads
        const formData = new FormData();

        // Add only fields that have values
        if (form.Name) formData.append("Name", form.Name);
        if (form.Email) formData.append("Email", form.Email);
        if (form.Phone) formData.append("Phone", form.Phone);
        if (form.Password) formData.append("Password", form.Password);
        if (form.role) formData.append("role", form.role);

        // Optional fields
        if (form.DepartmentId) formData.append("DepartmentId", form.DepartmentId);
        if (form.DesignationId) formData.append("DesignationId", form.DesignationId);
        if (form.BranchId) formData.append("BranchId", form.BranchId);
        if (form.EmployeeCode) formData.append("EmployeeCode", form.EmployeeCode);
        if (form.JoiningDate) formData.append("JoiningDate", form.JoiningDate);
        if (form.DateOfBirth) formData.append("DateOfBirth", form.DateOfBirth);

        // FIXED: Use AdhaarNumber (single 'a') to match schema
        if (form.AdhaarNumber) formData.append("AdhaarNumber", form.AdhaarNumber);
        if (form.PANNumber) formData.append("PANNumber", form.PANNumber);

        // Add Bank Details
        if (form.BankDetails.BankName)
            formData.append("BankDetails[BankName]", form.BankDetails.BankName);
        if (form.BankDetails.AccountHolderName)
            formData.append("BankDetails[AccountHolderName]", form.BankDetails.AccountHolderName);
        if (form.BankDetails.AccountNumber)
            formData.append("BankDetails[AccountNumber]", form.BankDetails.AccountNumber);
        if (form.BankDetails.IFSCCode)
            formData.append("BankDetails[IFSCCode]", form.BankDetails.IFSCCode);
        if (form.BankDetails.BranchName)
            formData.append("BankDetails[BranchName]", form.BankDetails.BranchName);

        // Add Profile Photo
        if (form.ProfilePhoto) {
            formData.append("ProfilePhoto", form.ProfilePhoto);
        }

        // CRITICAL FIX: Backend route expects "AadhaarCard" but schema uses "AdhaarCard"
        if (form.Documents.BankPassbook) {
            formData.append("BankPassbook", form.Documents.BankPassbook);
        }
        if (form.Documents.AdhaarCard) {
            formData.append("AadhaarCard", form.Documents.AdhaarCard);
        }
        if (form.Documents.PANCard) {
            formData.append("PANCard", form.Documents.PANCard);
        }

        // MULTIPLE MARKSHEETS
        if (form.Documents.Marksheets && form.Documents.Marksheets.length > 0) {
            console.log(`Appending ${form.Documents.Marksheets.length} marksheet(s)`);
            form.Documents.Marksheets.forEach((file, index) => {
                formData.append("Marksheets", file);
                console.log(`  - Marksheet ${index + 1}: ${file.name}`);
            });
        }

        // MULTIPLE OTHER DOCUMENTS
        if (form.Documents.OtherDocuments && form.Documents.OtherDocuments.length > 0) {
            console.log(`Appending ${form.Documents.OtherDocuments.length} other document(s)`);
            form.Documents.OtherDocuments.forEach((file, index) => {
                formData.append("OtherDocuments", file);
                console.log(`  - Other Document ${index + 1}: ${file.name}`);
            });
        }

        // Log FormData contents for debugging
        console.log("Update FormData contents:");
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        onUpdate(employee._id, formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[90vw] max-w-[90vw] p-8 overflow-auto max-h-[95vh]">
                <h2 className="text-2xl font-semibold mb-6">Edit Employee</h2>

                <form onSubmit={submit} className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Column 1: Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-1">
                                Personal Info
                            </h3>
                            <div>
                                <label className="text-sm font-medium">Full Name</label>
                                <input
                                    value={form.Name}
                                    onChange={(e) => updateField("Name", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    value={form.Email}
                                    onChange={(e) => updateField("Email", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Phone</label>
                                <input
                                    value={form.Phone}
                                    onChange={(e) => updateField("Phone", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={form.Password}
                                        onChange={(e) => updateField("Password", e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                                        placeholder="Leave empty to keep current"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Only fill if changing password</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Profile Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        updateField("ProfilePhoto", e.target.files[0])
                                    }
                                    className="w-full mt-1"
                                />
                                {form.ProfilePhoto && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ {form.ProfilePhoto.name}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload new to replace existing</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Date of Birth</label>
                                <input
                                    type="date"
                                    value={form.DateOfBirth}
                                    onChange={(e) => updateField("DateOfBirth", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Aadhaar Number</label>
                                <input
                                    value={form.AdhaarNumber}
                                    onChange={(e) => updateField("AdhaarNumber", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    placeholder="12-digit Aadhaar number"
                                    maxLength="12"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">PAN Number</label>
                                <input
                                    value={form.PANNumber}
                                    onChange={(e) => updateField("PANNumber", e.target.value.toUpperCase())}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                    placeholder="10-character PAN"
                                    maxLength="10"
                                />
                            </div>
                        </div>

                        {/* Column 2: Job Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-1">Job Info</h3>

                            <div>
                                <label className="text-sm font-medium">Department</label>
                                <select
                                    value={form.DepartmentId}
                                    onChange={(e) => updateField("DepartmentId", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d._id || d.id} value={d._id || d.id}>
                                            {d.DepartmentName || d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Designation</label>
                                <select
                                    value={form.DesignationId}
                                    onChange={(e) => updateField("DesignationId", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map((d) => (
                                        <option key={d._id || d.id} value={d._id || d.id}>
                                            {d.DesignationName || d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Branch</label>
                                <select
                                    value={form.BranchId}
                                    onChange={(e) => updateField("BranchId", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map((b) => (
                                        <option key={b._id || b.id} value={b._id || b.id}>
                                            {b.BranchName || b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Employee Code</label>
                                <input
                                    value={form.EmployeeCode}
                                    onChange={(e) => updateField("EmployeeCode", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Joining Date</label>
                                <input
                                    type="date"
                                    value={form.JoiningDate}
                                    onChange={(e) => updateField("JoiningDate", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                        </div>

                        {/* Column 3: Bank Details & Documents */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-1">
                                Bank Details
                            </h3>
                            <div>
                                <label className="text-sm font-medium">Bank Name</label>
                                <input
                                    value={form.BankDetails.BankName}
                                    onChange={(e) => updateBankField("BankName", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Account Holder Name
                                </label>
                                <input
                                    value={form.BankDetails.AccountHolderName}
                                    onChange={(e) =>
                                        updateBankField("AccountHolderName", e.target.value)
                                    }
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Account Number</label>
                                <input
                                    value={form.BankDetails.AccountNumber}
                                    onChange={(e) =>
                                        updateBankField("AccountNumber", e.target.value)
                                    }
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">IFSC Code</label>
                                <input
                                    value={form.BankDetails.IFSCCode}
                                    onChange={(e) => updateBankField("IFSCCode", e.target.value)}
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Branch Name</label>
                                <input
                                    value={form.BankDetails.BranchName}
                                    onChange={(e) =>
                                        updateBankField("BranchName", e.target.value)
                                    }
                                    className="w-full border rounded px-3 py-2 mt-1"
                                />
                            </div>

                            <h3 className="text-lg font-semibold border-b pb-1 pt-4">
                                Documents
                            </h3>
                            <div>
                                <label className="text-sm font-medium">Bank Passbook</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            Documents: {
                                                ...prev.Documents,
                                                BankPassbook: e.target.files[0] || null,
                                            },
                                        }))
                                    }
                                    className="w-full mt-1"
                                />
                                {form.Documents.BankPassbook && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ {form.Documents.BankPassbook.name}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload new to replace</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Aadhaar Card</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            Documents: {
                                                ...prev.Documents,
                                                AdhaarCard: e.target.files[0] || null,
                                            },
                                        }))
                                    }
                                    className="w-full mt-1"
                                />
                                {form.Documents.AdhaarCard && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ {form.Documents.AdhaarCard.name}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload new to replace</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">PAN Card</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            Documents: {
                                                ...prev.Documents,
                                                PANCard: e.target.files[0] || null,
                                            },
                                        }))
                                    }
                                    className="w-full mt-1"
                                />
                                {form.Documents.PANCard && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ {form.Documents.PANCard.name}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload new to replace</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Marksheets (Multiple)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        setForm((prev) => ({
                                            ...prev,
                                            Documents: {
                                                ...prev.Documents,
                                                Marksheets: [...prev.Documents.Marksheets, ...newFiles],
                                            },
                                        }));
                                        e.target.value = ''; // Clear input for reuse
                                    }}
                                    className="w-full mt-1"
                                />
                                {form.Documents.Marksheets.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-medium text-gray-700">Selected files ({form.Documents.Marksheets.length}):</p>
                                        {form.Documents.Marksheets.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded border border-green-200">
                                                <span className="text-xs text-green-700 truncate flex-1">✓ {file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            Documents: {
                                                                ...prev.Documents,
                                                                Marksheets: prev.Documents.Marksheets.filter((_, i) => i !== idx)
                                                            }
                                                        }));
                                                    }}
                                                    className="ml-2 text-red-600 hover:text-red-800 text-xs font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload new files to add</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Other Documents (Multiple)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        setForm((prev) => ({
                                            ...prev,
                                            Documents: {
                                                ...prev.Documents,
                                                OtherDocuments: [...prev.Documents.OtherDocuments, ...newFiles],
                                            },
                                        }));
                                        e.target.value = ''; // Clear input for reuse
                                    }}
                                    className="w-full mt-1"
                                />
                                {form.Documents.OtherDocuments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-medium text-gray-700">Selected files ({form.Documents.OtherDocuments.length}):</p>
                                        {form.Documents.OtherDocuments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded border border-purple-200">
                                                <span className="text-xs text-purple-700 truncate flex-1">✓ {file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            Documents: {
                                                                ...prev.Documents,
                                                                OtherDocuments: prev.Documents.OtherDocuments.filter((_, i) => i !== idx)
                                                            }
                                                        }));
                                                    }}
                                                    className="ml-2 text-red-600 hover:text-red-800 text-xs font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Upload new files to add (Resume, Certificates, etc.)</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white"
                        >
                            Update Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}