import React, { useState, useEffect } from 'react';
import { MdClose, MdCloudUpload, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const EditHRProfileModal = ({ isOpen, onClose, hrData, onUpdate }) => {
    const [formData, setFormData] = useState({
        Name: '',
        Phone: '',
        DateOfBirth: '',
        AdhaarNumber: '',
        PANNumber: '',
        BankDetails: {
            BankName: '',
            AccountNumber: '',
            IFSC: '',
            BranchName: ''
        },
        // Password removed
    });

    // File states
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [bankPassbook, setBankPassbook] = useState(null);
    const [aadhaarCard, setAadhaarCard] = useState(null);
    const [panCard, setPanCard] = useState(null);
    const [marksheets, setMarksheets] = useState([]);
    const [otherDocuments, setOtherDocuments] = useState([]); // Added Other Documents

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (hrData) {
            setFormData(prev => ({
                ...prev,
                Name: hrData.Name || '',
                Phone: hrData.Phone || hrData.PhoneNumber || '',
                DateOfBirth: hrData.DateOfBirth ? new Date(hrData.DateOfBirth).toISOString().split('T')[0] : '',
                AdhaarNumber: hrData.AdhaarNumber || hrData.AadhaarNumber || '',
                PANNumber: hrData.PANNumber || '',
                BankDetails: {
                    BankName: hrData.BankDetails?.BankName || '',
                    AccountNumber: hrData.BankDetails?.AccountNumber || '',
                    IFSC: hrData.BankDetails?.IFSC || '',
                    BranchName: hrData.BankDetails?.BranchName || ''
                },
            }));
            // Clear files on open
            setProfilePhoto(null);
            setBankPassbook(null);
            setAadhaarCard(null);
            setPanCard(null);
            setMarksheets([]);
            setOtherDocuments([]);
            setError(null);
        }
    }, [hrData, isOpen]);

    // handleChange removed/unused since fields are disabled, but kept for logic if needed (or just dummy)
    // Actually, since they are disabled, we don't strictly need handleChange on them, but React complains if no onChange on value inputs.
    // We will keep it but it won't be triggered by user typing.
    const handleChange = (e) => {
        // No-op for disabled fields
    };

    const handleFileChange = (e, setFile) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleMarksheetsChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setMarksheets(prev => [...prev, ...files]);
            e.target.value = ''; // Reset input
        }
    };

    const handleOtherDocumentsChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setOtherDocuments(prev => [...prev, ...files]);
            e.target.value = ''; // Reset input
        }
    };

    const removeMarksheet = (index) => {
        setMarksheets(prev => prev.filter((_, i) => i !== index));
    };

    const removeOtherDocument = (index) => {
        setOtherDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const submitData = new FormData();

            // Append basic fields (even if disabled, we might want to send them, 
            // OR we rely on backend not updating if not provided. 
            // But usually 'update' expects only changed fields or all fields.
            // Since we are NOT updating them, we can skip appending them if backend allows partial updates.
            // HOWEVER, based on typical patterns here, we append everything.
            // But since user CANNOT change them, sending existing values is fine.
            submitData.append('Name', formData.Name);
            submitData.append('Phone', formData.Phone);
            submitData.append('DateOfBirth', formData.DateOfBirth);
            submitData.append('AdhaarNumber', formData.AdhaarNumber);
            submitData.append('PANNumber', formData.PANNumber);

            // Append Bank Details
            submitData.append('BankDetails[BankName]', formData.BankDetails.BankName);
            submitData.append('BankDetails[AccountNumber]', formData.BankDetails.AccountNumber);
            submitData.append('BankDetails[IFSC]', formData.BankDetails.IFSC);
            submitData.append('BankDetails[BranchName]', formData.BankDetails.BranchName);

            // Append Files
            if (profilePhoto) submitData.append('ProfilePhoto', profilePhoto);
            if (bankPassbook) submitData.append('BankPassbook', bankPassbook);
            if (aadhaarCard) submitData.append('AadhaarCard', aadhaarCard);
            if (panCard) submitData.append('PANCard', panCard);

            if (marksheets.length > 0) {
                marksheets.forEach(file => {
                    submitData.append('Marksheets', file);
                });
            }

            if (otherDocuments.length > 0) {
                otherDocuments.forEach(file => {
                    submitData.append('OtherDocuments', file);
                });
            }

            await onUpdate(submitData);
            onClose();
        } catch (err) {
            console.error("Update failed", err);
            setError(err.response?.data?.message || err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <MdClose size={24} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Details (Read Only) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Personal Details (Read Only)</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input disabled type="text" value={formData.Name} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input disabled type="tel" value={formData.Phone} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                                <input disabled type="date" value={formData.DateOfBirth} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                        </div>

                        {/* Identity & Banking (Read Only) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2">Identity & Banking (Read Only)</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adhaar Number</label>
                                <input disabled type="text" value={formData.AdhaarNumber} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
                                <input disabled type="text" value={formData.PANNumber} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                                <input disabled type="text" value={formData.BankDetails.BankName} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                                <input disabled type="text" value={formData.BankDetails.AccountNumber} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
                                <input disabled type="text" value={formData.BankDetails.IFSC} className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    {/* Section: Documents */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b dark:border-gray-700">Document Uploads</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setProfilePhoto)} className="w-full text-sm text-gray-500 dark:text-gray-400" />
                                <p className="text-xs text-gray-500 mt-1">Upload new to replace existing</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Passbook/Cheque</label>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, setBankPassbook)} className="w-full text-sm text-gray-500 dark:text-gray-400" />
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aadhaar Card</label>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, setAadhaarCard)} className="w-full text-sm text-gray-500 dark:text-gray-400" />
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PAN Card</label>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, setPanCard)} className="w-full text-sm text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>

                        {/* Multiple Documents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Educational Marksheets (Multiple)</label>
                                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleMarksheetsChange} className="w-full text-sm text-gray-500 dark:text-gray-400" />
                                <div className="mt-2 space-y-2">
                                    {marksheets.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-gray-600 p-2 rounded border dark:border-gray-500">
                                            <span className="truncate">{file.name}</span>
                                            <button type="button" onClick={() => removeMarksheet(idx)} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Other Documents (Multiple)</label>
                                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleOtherDocumentsChange} className="w-full text-sm text-gray-500 dark:text-gray-400" />
                                <div className="mt-2 space-y-2">
                                    {otherDocuments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-gray-600 p-2 rounded border dark:border-gray-500">
                                            <span className="truncate">{file.name}</span>
                                            <button type="button" onClick={() => removeOtherDocument(idx)} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Documents'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditHRProfileModal;
