import React, { useState } from "react";
import { useBranches } from "../../context/BranchContext";
import { useSelector } from "react-redux";
import { FiUpload, FiX, FiFileText, FiPlus, FiTrash2 } from "react-icons/fi";

export default function AddUserModal({ open, onClose, onAdd, isLoading }) {
  const { branches = [], departments = [], designations = [] } = useBranches();
  const { companyId } = useSelector((state) => state.auth);
  const actualCompanyId = companyId?._id || companyId;

  const [form, setForm] = useState({
    Name: "",
    Email: "",
    Phone: "",
    Password: "",
    role: "Employee",
    Department: "",
    Designation: "",
    BranchId: "",
    EmployeeCode: "",
    JoiningDate: "",
    DateOfBirth: "",
    AdhaarNumber: "",
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
      AadhaarCard: null,
      PANCard: null,
      Marksheets: [],
      OtherDocuments: [],
    },
  });

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

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        Documents: { ...prev.Documents, [docType]: file },
      }));
    }
  };

  const handleMarksheetsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setForm((prev) => ({
        ...prev,
        Documents: {
          ...prev.Documents,
          Marksheets: [...prev.Documents.Marksheets, ...files],
        },
      }));
    }
    e.target.value = ""; // Reset input
  };

  const removeMarksheet = (index) => {
    setForm((prev) => ({
      ...prev,
      Documents: {
        ...prev.Documents,
        Marksheets: prev.Documents.Marksheets.filter((_, i) => i !== index),
      },
    }));
  };

  const handleOtherDocumentsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setForm((prev) => ({
        ...prev,
        Documents: {
          ...prev.Documents,
          OtherDocuments: [...prev.Documents.OtherDocuments, ...files],
        },
      }));
    }
    e.target.value = ""; // Reset input
  };

  const removeOtherDocument = (index) => {
    setForm((prev) => ({
      ...prev,
      Documents: {
        ...prev.Documents,
        OtherDocuments: prev.Documents.OtherDocuments.filter((_, i) => i !== index),
      },
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.Name || !form.Email) {
      alert("Please provide name and email");
      return;
    }

    if (!form.Name || !form.Email) {
      alert("Please provide name and email");
      return;
    }

    // Removed BranchId check

    // Convert to FormData
    const formData = new FormData();
    formData.append("CompanyId", actualCompanyId);
    formData.append("Name", form.Name);
    formData.append("Email", form.Email);
    formData.append("role", form.role);

    if (form.Phone) formData.append("Phone", form.Phone);
    if (form.Password) formData.append("Password", form.Password);
    if (form.Department) formData.append("DepartmentId", form.Department); // Note: Backend expects DepartmentId
    if (form.Designation) formData.append("DesignationId", form.Designation); // Note: Backend expects DesignationId
    if (form.BranchId) formData.append("BranchId", form.BranchId);
    if (form.EmployeeCode) formData.append("EmployeeCode", form.EmployeeCode);
    if (form.JoiningDate) formData.append("JoiningDate", form.JoiningDate);
    if (form.DateOfBirth) formData.append("DateOfBirth", form.DateOfBirth);
    if (form.AdhaarNumber) formData.append("AdhaarNumber", form.AdhaarNumber);
    if (form.PANNumber) formData.append("PANNumber", form.PANNumber);

    // Bank Details
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

    // Profile Photo
    if (form.ProfilePhoto) {
      formData.append("ProfilePhoto", form.ProfilePhoto);
    }

    // Documents
    if (form.Documents.BankPassbook) {
      formData.append("BankPassbook", form.Documents.BankPassbook);
    }
    if (form.Documents.AadhaarCard) {
      formData.append("AadhaarCard", form.Documents.AadhaarCard);
    }
    if (form.Documents.PANCard) {
      formData.append("PANCard", form.Documents.PANCard);
    }
    if (form.Documents.Marksheets && form.Documents.Marksheets.length > 0) {
      form.Documents.Marksheets.forEach((file) => {
        formData.append("Marksheets", file);
      });
    }
    if (form.Documents.OtherDocuments && form.Documents.OtherDocuments.length > 0) {
      form.Documents.OtherDocuments.forEach((file) => {
        formData.append("OtherDocuments", file);
      });
    }

    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-[90vw] max-w-[90vw] p-8 overflow-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Add Employee</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Personal Info */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Personal Info
              </h3>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    value={form.Name}
                    onChange={(e) => updateField("Name", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    value={form.Email}
                    onChange={(e) => updateField("Email", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Phone</label>
                  <input
                    value={form.Phone}
                    onChange={(e) => updateField("Phone", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Password</label>
                  <input
                    type="password"
                    value={form.Password}
                    onChange={(e) => updateField("Password", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.DateOfBirth}
                    onChange={(e) => updateField("DateOfBirth", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Profile Photo</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                      <FiUpload />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateField("ProfilePhoto", e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    {form.ProfilePhoto && (
                      <span className="text-xs text-green-600 truncate max-w-[150px]">
                        {form.ProfilePhoto.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Fields */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identity Details</h4>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Aadhaar Number</label>
                  <input
                    value={form.AdhaarNumber}
                    onChange={(e) => updateField("AdhaarNumber", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">PAN Number</label>
                  <input
                    value={form.PANNumber}
                    onChange={(e) => updateField("PANNumber", e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    placeholder="10-digit PAN"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Job Info */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-300">Job Info</h3>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Employee</option>
                    <option>HR</option>
                    <option>CA</option>
                    <option>Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Branch</label>
                  <select
                    value={form.BranchId}
                    onChange={(e) => updateField("BranchId", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.BranchName || b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Department</label>
                  <select
                    value={form.Department}
                    onChange={(e) => updateField("Department", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.DepartmentName || d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Designation</label>
                  <select
                    value={form.Designation}
                    onChange={(e) => updateField("Designation", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((d) => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.DesignationName || d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Employee Code</label>
                  <input
                    value={form.EmployeeCode}
                    onChange={(e) => updateField("EmployeeCode", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={form.JoiningDate}
                    onChange={(e) => updateField("JoiningDate", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Docs & Bank */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-300">Documents & Bank</h3>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 h-[600px] overflow-y-auto custom-scrollbar">
                {/* Bank Details */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bank Account</h4>
                  <div className="space-y-2">
                    <input
                      value={form.BankDetails.BankName}
                      onChange={(e) => updateBankField("BankName", e.target.value)}
                      placeholder="Bank Name"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      value={form.BankDetails.AccountNumber}
                      onChange={(e) => updateBankField("AccountNumber", e.target.value)}
                      placeholder="Account Number"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      value={form.BankDetails.AccountHolderName}
                      onChange={(e) => updateBankField("AccountHolderName", e.target.value)}
                      placeholder="Holder Name"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      value={form.BankDetails.IFSCCode}
                      onChange={(e) => updateBankField("IFSCCode", e.target.value)}
                      placeholder="IFSC Code"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      value={form.BankDetails.BranchName}
                      onChange={(e) => updateBankField("BranchName", e.target.value)}
                      placeholder="Branch Name"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="mt-2">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">Passbook Upload</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(e, "BankPassbook")}
                        className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Identity Docs */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identity Documents</h4>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">Aadhaar Card</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(e, "AadhaarCard")}
                      className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 dark:file:bg-orange-900/50 file:text-orange-700 dark:file:text-orange-300 hover:file:bg-orange-100 dark:hover:file:bg-orange-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">PAN Card</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(e, "PANCard")}
                      className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900"
                    />
                  </div>
                </div>

                {/* Marksheets */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Marksheets</h4>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleMarksheetsChange}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 dark:file:bg-green-900/50 file:text-green-700 dark:file:text-green-300 hover:file:bg-green-100 dark:hover:file:bg-green-900 mb-2"
                  />
                  {form.Documents.Marksheets.length > 0 && (
                    <div className="space-y-1">
                      {form.Documents.Marksheets.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 p-1.5 rounded dark:text-gray-300">
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeMarksheet(idx)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Documents */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Other Documents</h4>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleOtherDocumentsChange}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 dark:file:bg-purple-900/50 file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-100 dark:hover:file:bg-purple-900 mb-2"
                  />
                  {form.Documents.OtherDocuments.length > 0 && (
                    <div className="space-y-1">
                      {form.Documents.OtherDocuments.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 p-1.5 rounded dark:text-gray-300">
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeOtherDocument(idx)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-blue-500/30 transition flex items-center gap-2 ${isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                "Add Employee"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
