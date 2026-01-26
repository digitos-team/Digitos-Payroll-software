import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, CreditCard,
  Building, Briefcase, FileText, Upload, CheckCircle, X, Loader
} from 'lucide-react';
import { getEmployeeById, updateEmployee } from '../../utils/api/employeeapi';

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
      <Icon size={24} />
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const DetailField = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1.5 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-gray-400" />}
      {label}
    </label>
    <p className="text-gray-900 font-medium text-base truncate">
      {value || <span className="text-gray-400 italic">Not Provided</span>}
    </p>
  </div>
);

const FileDropZone = ({ label, name, onChange, file }) => (
  <motion.div
    className="flex flex-col gap-2"
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <label className={`
      relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
      ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400'}
    `}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        {file ? (
          <>
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-sm text-green-700 font-medium truncate w-full px-2">{file.name}</p>
            <p className="text-xs text-green-600">Click to change</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500"><span className="font-semibold text-indigo-600">Click to upload</span></p>
            <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (Max 5MB)</p>
          </>
        )}
      </div>
      <input type="file" name={name} onChange={onChange} className="hidden" />
    </label>
  </motion.div>
);

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [documents, setDocuments] = useState({
    bankPassbook: null,
    aadharCard: null,
    panCard: null,
    marksheets: [], // Array of File objects
    otherDocuments: [] // Array of File objects
  });

  useEffect(() => {
    const fetchEmployeeData = async () => {
      console.log('🔍 PROFILE - Starting to fetch employee data');
      console.log('🔍 PROFILE - User from Redux:', user);

      const userId = user?.id || user?._id;
      console.log('🔍 PROFILE - User ID:', userId);

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 PROFILE - Calling getEmployeeById with ID:', userId);
        const response = await getEmployeeById(userId);
        console.log('🔍 PROFILE - Employee data received:', response);

        setEmployeeData(response);
      } catch (err) {
        console.error('❌ PROFILE - Error fetching employee data:', err);
        console.error('❌ PROFILE - Error details:', err.message);
        setError(err.message || 'Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id || user?._id) {
      console.log('🔍 PROFILE - User ID exists, fetching data...');
      fetchEmployeeData();
    } else {
      console.warn('⚠️ PROFILE - No user ID found in Redux state');
      console.log('⚠️ PROFILE - Current user object:', user);
      setLoading(false);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setDocuments(prev => ({
      ...prev,
      [name]: files ? files[0] : null
    }));
  };

  const handleMarksheetsChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array and ADD to existing marksheets
      const fileArray = Array.from(files);
      setDocuments(prev => ({
        ...prev,
        marksheets: [...prev.marksheets, ...fileArray] // Append new files to existing ones
      }));
      // Clear the file input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const removeMarksheet = (index) => {
    setDocuments(prev => ({
      ...prev,
      marksheets: prev.marksheets.filter((_, i) => i !== index)
    }));
  };

  const handleOtherDocumentsChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setDocuments(prev => ({
        ...prev,
        otherDocuments: [...prev.otherDocuments, ...fileArray]
      }));
      e.target.value = '';
    }
  };

  const removeOtherDocument = (index) => {
    setDocuments(prev => ({
      ...prev,
      otherDocuments: prev.otherDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const userId = user?.id || user?._id;

      // Build Documents object with proper PascalCase keys and only include non-null files
      const documentsToUpload = {};

      if (documents.bankPassbook) {
        documentsToUpload.BankPassbook = documents.bankPassbook;
      }
      if (documents.aadharCard) {
        documentsToUpload.AadhaarCard = documents.aadharCard;
      }
      if (documents.panCard) {
        documentsToUpload.PANCard = documents.panCard;
      }
      if (documents.marksheets && documents.marksheets.length > 0) {
        // Marksheets expects an array of files
        documentsToUpload.Marksheets = documents.marksheets;
      }
      if (documents.otherDocuments && documents.otherDocuments.length > 0) {
        // OtherDocuments expects an array of files
        documentsToUpload.OtherDocuments = documents.otherDocuments;
      }

      // Check if there are any documents to upload
      if (Object.keys(documentsToUpload).length === 0) {
        setError('Please select at least one document to upload');
        setLoading(false);
        return;
      }

      const updateData = {
        _id: userId,
        Documents: documentsToUpload
      };

      console.log('📤 Submitting documents:', documentsToUpload);

      await updateEmployee(updateData);
      setUploadSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);

      // Reset document state
      setDocuments({
        bankPassbook: null,
        aadharCard: null,
        panCard: null,
        marksheets: [],
        otherDocuments: []
      });

      // Refresh employee data to show updated documents
      const response = await getEmployeeById(userId);
      setEmployeeData(response);
    } catch (err) {
      console.error('Error uploading documents:', err);
      setError(err.message || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading && !employeeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error && !employeeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={sectionVariants} className="mb-8 pl-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Access Employee Information</h1>
          <p className="text-gray-500 mt-2 text-base">View your personal details and manage document uploads.</p>
        </motion.div>

        {/* Profile Photo Section */}
        <motion.div
          variants={sectionVariants}
          className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-6">
            {/* Profile Photo */}
            <div className="relative">
              {employeeData?.ProfilePhoto ? (
                <img
                  src={`http://localhost:5000/${employeeData.ProfilePhoto.replace(/\\/g, "/")}`}
                  alt={employeeData?.Name || "Employee"}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              {/* Fallback to initials */}
              <div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md"
                style={{ display: employeeData?.ProfilePhoto ? 'none' : 'flex' }}
              >
                {employeeData?.Name ? employeeData.Name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'EM'}
              </div>
            </div>

            {/* Employee Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{employeeData?.Name || 'Employee'}</h2>
              <p className="text-gray-600 mt-1">{employeeData?.Email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {employeeData?.role || 'Employee'}
                </span>
                {employeeData?.EmployeeCode && (
                  <span className="text-sm text-gray-500">
                    ID: {employeeData.EmployeeCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-green-900 font-bold text-lg">Documents Uploaded Successfully! 🎉</p>
                <p className="text-green-700 text-sm mt-1">Your documents have been saved and are now visible in the "Uploaded Documents" section above.</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && employeeData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <X className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.div variants={sectionVariants} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <SectionHeader icon={User} title="Personal Information" description="Basic identification details (Read-Only)" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                <DetailField label="Full Name" value={employeeData?.Name || employeeData?.FullName} icon={User} />
                <DetailField label="Email" value={employeeData?.Email} icon={Mail} />
                <DetailField label="Phone" value={employeeData?.Phone} icon={Phone} />
                <DetailField label="Date of Birth" value={employeeData?.DateOfBirth ? new Date(employeeData.DateOfBirth).toLocaleDateString() : null} icon={Calendar} />
                <DetailField label="Aadhaar Number" value={employeeData?.AdhaarNumber} />
                <DetailField label="PAN Number" value={employeeData?.PANNumber} />
              </div>
            </div>
          </motion.div>

          <motion.div variants={sectionVariants} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <SectionHeader icon={Briefcase} title="Employment Details" description="Role and department information (Read-Only)" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                <DetailField label="Department" value={employeeData?.DepartmentId?.DepartmentName || employeeData?.DepartmentId} />
                <DetailField label="Designation" value={employeeData?.DesignationId?.DesignationName || employeeData?.DesignationId} />
                <DetailField label="Branch" value={employeeData?.BranchId?.BranchName || employeeData?.BranchId} />
                <DetailField label="Joining Date" value={employeeData?.JoiningDate ? new Date(employeeData.JoiningDate).toLocaleDateString() : null} icon={Calendar} />
              </div>
            </div>
          </motion.div>

          <motion.div variants={sectionVariants} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <SectionHeader icon={Building} title="Banking Information" description="Salary account details (Read-Only)" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                <DetailField label="Bank Name" value={employeeData?.BankDetails?.BankName} icon={Building} />
                <DetailField label="Account Holder" value={employeeData?.BankDetails?.AccountHolderName} icon={User} />
                <DetailField label="Account Number" value={employeeData?.BankDetails?.AccountNumber} icon={CreditCard} />
                <DetailField label="IFSC Code" value={employeeData?.BankDetails?.IFSCCode} />
                <DetailField label="Branch Name" value={employeeData?.BankDetails?.BranchName} />
              </div>
            </div>
          </motion.div>

          {/* Existing Uploaded Documents Section */}
          {employeeData?.Documents && (
            <motion.div variants={sectionVariants} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <SectionHeader icon={FileText} title="Uploaded Documents" description="Your previously uploaded documents" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bank Passbook */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Bank Passbook</h4>
                    {employeeData.Documents?.BankPassbook?.filepath ? (
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <FileText className="text-blue-600 w-5 h-5" />
                          <span className="text-sm text-gray-700">
                            {employeeData.Documents.BankPassbook.filename || "Bank Passbook"}
                          </span>
                        </div>
                        <a
                          href={`http://localhost:5000/${employeeData.Documents.BankPassbook.filepath.replace(/\\/g, "/")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">Not uploaded</div>
                    )}
                  </div>

                  {/* Aadhaar Card */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Aadhaar Card</h4>
                    {employeeData.Documents?.AdhaarCard?.filepath ? (
                      <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2">
                          <FileText className="text-orange-600 w-5 h-5" />
                          <span className="text-sm text-gray-700">
                            {employeeData.Documents.AdhaarCard.filename || "Aadhaar Card"}
                          </span>
                        </div>
                        <a
                          href={`http://localhost:5000/${employeeData.Documents.AdhaarCard.filepath.replace(/\\/g, "/")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-800 flex items-center gap-1 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">Not uploaded</div>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">PAN Card</h4>
                    {employeeData.Documents?.PANCard?.filepath ? (
                      <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <FileText className="text-indigo-600 w-5 h-5" />
                          <span className="text-sm text-gray-700">
                            {employeeData.Documents.PANCard.filename || "PAN Card"}
                          </span>
                        </div>
                        <a
                          href={`http://localhost:5000/${employeeData.Documents.PANCard.filepath.replace(/\\/g, "/")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg">Not uploaded</div>
                    )}
                  </div>

                  {/* Marksheets */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Marksheets</h4>
                    {employeeData.Documents?.Marksheets && employeeData.Documents.Marksheets.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {employeeData.Documents.Marksheets.map((marksheet, index) => (
                          <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2">
                              <FileText className="text-green-600 w-5 h-5" />
                              <span className="text-sm text-gray-700">
                                {marksheet.filename || `Marksheet ${index + 1}`}
                              </span>
                            </div>
                            <a
                              href={`http://localhost:5000/${marksheet.filepath.replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm font-medium"
                            >
                              View
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
                    {employeeData.Documents?.OtherDocuments && employeeData.Documents.OtherDocuments.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {employeeData.Documents.OtherDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2">
                              <FileText className="text-purple-600 w-5 h-5" />
                              <span className="text-sm text-gray-700">
                                {doc.filename || `Document ${index + 1}`}
                              </span>
                            </div>
                            <a
                              href={`http://localhost:5000/${doc.filepath.replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm font-medium"
                            >
                              View
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
            </motion.div>
          )}

          <form onSubmit={handleDocumentSubmit}>
            <motion.div variants={sectionVariants} className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="p-6 md:p-8">
                <SectionHeader icon={Upload} title="Upload New Documents" description="Upload or replace verification documents" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <FileDropZone label="Bank Passbook" name="bankPassbook" onChange={handleFileChange} file={documents.bankPassbook} />
                  <FileDropZone label="Aadhaar Card" name="aadharCard" onChange={handleFileChange} file={documents.aadharCard} />
                  <FileDropZone label="PAN Card" name="panCard" onChange={handleFileChange} file={documents.panCard} />
                </div>

                {/* Marksheets Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Marksheets
                  </h3>


                  {/* File Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Marksheets (You can select multiple files)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleMarksheetsChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Hold Ctrl (Windows) or Cmd (Mac) to select multiple files at once
                    </p>
                  </div>

                  {/* List of Selected Files */}
                  {documents.marksheets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected Files ({documents.marksheets.length})
                      </p>
                      {documents.marksheets.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 truncate">{file.name}</p>
                              <p className="text-xs text-gray-600">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMarksheet(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-lg transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Documents Section */}
                <div className="mb-8 items-center bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Other Documents
                  </h3>

                  {/* File Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Other Documents (Multiple files allowed)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleOtherDocumentsChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Resumes, Certificates, ID Proofs, etc. (Max 5MB per file)
                    </p>
                  </div>

                  {/* List of Selected Files */}
                  {documents.otherDocuments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected Files ({documents.otherDocuments.length})
                      </p>
                      {documents.otherDocuments.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 truncate">{file.name}</p>
                              <p className="text-xs text-gray-600">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOtherDocument(index)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-lg transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Update Documents
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </form>

        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
