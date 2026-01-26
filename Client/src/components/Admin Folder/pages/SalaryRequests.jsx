import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MdCheck, MdClose, MdVisibility } from 'react-icons/md';
import { fetchSalaryRequests, approveSalaryRequest, rejectSalaryRequest } from '../../HR Folder/utils/api/SalaryAPi';

export default function SalaryRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const { companyId } = useSelector((state) => state.auth);

    useEffect(() => {
        if (companyId) {
            loadRequests();
        }
    }, [companyId]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await fetchSalaryRequests(companyId);
            setRequests(data?.data || []);
        } catch (error) {
            console.error("Failed to load requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!window.confirm("Are you sure you want to approve this salary update?")) return;
        try {
            await approveSalaryRequest(requestId);
            alert("Request approved successfully.");
            loadRequests();
        } catch (error) {
            alert("Failed to approve request.");
        }
    };

    const handleReject = async (requestId) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await rejectSalaryRequest(requestId, reason);
            alert("Request rejected.");
            loadRequests();
        } catch (error) {
            alert("Failed to reject request.");
        }
    };

    const [selectedRequest, setSelectedRequest] = useState(null);

    const openDetails = (req) => {
        setSelectedRequest(req);
    };

    const closeDetails = () => {
        setSelectedRequest(null);
    };

    const calculateTotals = (heads) => {
        let earnings = 0;
        let deductions = 0;

        heads.forEach(h => {
            const amt = h.applicableValue || 0;
            const type = h.SalaryHeadId?.SalaryHeadsType || 'Earnings';
            if (type === 'Deductions') {
                deductions += amt;
            } else {
                earnings += amt;
            }
        });

        return { earnings, deductions, net: earnings - deductions };
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Salary Change Requests</h2>
            <p className="text-gray-500 mb-6">Review and approve salary changes requested by HR.</p>

            {loading ? (
                <div>Loading...</div>
            ) : requests.length === 0 ? (
                <div className="text-gray-500">No pending requests.</div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req._id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-lg">{req.EmployeeID?.Name}</h4>
                                <p className="text-sm text-gray-500">{req.EmployeeID?.Email}</p>
                                <p className="text-xs text-gray-400">{req.EmployeeID?.Department} - {req.EmployeeID?.Designation}</p>
                                <div className="mt-2 text-sm">
                                    <span className="font-medium text-gray-700">Requested By:</span> {req.RequestedBy?.Name} <br />
                                    <span className="font-medium text-gray-700">Date:</span> {new Date(req.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex gap-2 flex-col sm:flex-row items-end">
                                <button
                                    onClick={() => openDetails(req)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700"
                                >
                                    <MdVisibility /> View Details
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(req._id)}
                                        className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1 hover:bg-green-700"
                                    >
                                        <MdCheck /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(req._id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-1 hover:bg-red-700"
                                    >
                                        <MdClose /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">Salary Configuration Details</h3>
                            <button onClick={closeDetails} className="text-gray-500 hover:text-gray-700">
                                <MdClose size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex justify-between bg-gray-50 p-3 rounded">
                                <div>
                                    <p className="text-sm text-gray-500">Employee</p>
                                    <p className="font-medium">{selectedRequest.EmployeeID?.Name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Effective Date</p>
                                    <p className="font-medium">{new Date(selectedRequest.EffectFrom).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tax</p>
                                    <p className="font-medium">{selectedRequest.isTaxApplicable ? "Applicable" : "Not Applicable"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Earnings */}
                                <div className="border rounded p-3">
                                    <h4 className="font-semibold text-green-700 mb-2 border-b pb-1">Earnings</h4>
                                    <div className="space-y-2">
                                        {selectedRequest.SalaryHeads
                                            .filter(h => h.SalaryHeadId?.SalaryHeadsType === 'Earnings')
                                            .map((h, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span>{h.SalaryHeadId?.SalaryHeadsTitle} ({h.SalaryHeadId?.ShortName})</span>
                                                    <span className="font-medium">₹{h.applicableValue}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="border rounded p-3">
                                    <h4 className="font-semibold text-red-700 mb-2 border-b pb-1">Deductions</h4>
                                    <div className="space-y-2">
                                        {selectedRequest.SalaryHeads
                                            .filter(h => h.SalaryHeadId?.SalaryHeadsType === 'Deductions')
                                            .map((h, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span>{h.SalaryHeadId?.SalaryHeadsTitle} ({h.SalaryHeadId?.ShortName})</span>
                                                    <span className="font-medium">₹{h.applicableValue}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center text-sm sm:text-base">
                                <div>
                                    <p className="text-gray-600">Gross Earnings</p>
                                    <p className="font-bold text-green-700">₹{calculateTotals(selectedRequest.SalaryHeads).earnings.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Total Deductions</p>
                                    <p className="font-bold text-red-700">₹{calculateTotals(selectedRequest.SalaryHeads).deductions.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Net Form Salary</p>
                                    <p className="font-bold text-blue-700 text-lg">₹{calculateTotals(selectedRequest.SalaryHeads).net.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        handleApprove(selectedRequest._id);
                                        closeDetails();
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Approve Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
