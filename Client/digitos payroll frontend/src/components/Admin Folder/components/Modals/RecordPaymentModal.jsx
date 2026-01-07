import React, { useState } from "react";

const RecordPaymentModal = ({ open, onClose, onRecord, order, isConfirmation = false }) => {
    const [form, setForm] = useState({
        amount: "",
        paymentMethod: "Bank Transfer",
        transactionId: "",
        notes: "",
    });

    if (!open || !order) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const paymentAmount = Number(form.amount);

        // Validation
        if (paymentAmount <= 0) {
            alert("Please enter a valid payment amount");
            return;
        }

        if (paymentAmount > order.BalanceDue) {
            alert(`Payment amount (₹${paymentAmount}) cannot exceed balance due (₹${order.BalanceDue})`);
            return;
        }

        onRecord({
            amount: paymentAmount,
            paymentMethod: form.paymentMethod,
            transactionId: form.transactionId,
            notes: form.notes,
        });

        onClose();
        resetForm();
    };

    const resetForm = () => {
        setForm({
            amount: "",
            paymentMethod: "Bank Transfer",
            transactionId: "",
            notes: "",
        });
    };

    const paymentAmount = Number(form.amount || 0);
    const newBalance = order.BalanceDue - paymentAmount;
    const willBeFullyPaid = newBalance === 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl max-h-[85vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-3">
                    {isConfirmation ? "Confirm Order & Record Payment" : "Record Payment"}
                </h2>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-1">Order Summary</h3>
                    <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Client:</span>
                            <span className="font-medium">{order.ClientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Service:</span>
                            <span className="font-medium">{order.ServiceTitle}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold">₹{order.Amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Already Paid:</span>
                            <span className="font-medium text-green-600">₹{order.AdvancePaid?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Balance Due:</span>
                            <span className="font-semibold text-red-600">₹{order.BalanceDue?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Payment Amount */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Payment Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="amount"
                            type="number"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            min="0"
                            max={order.BalanceDue}
                            step="0.01"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum: ₹{order.BalanceDue?.toLocaleString()}
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Method</label>
                        <select
                            name="paymentMethod"
                            value={form.paymentMethod}
                            onChange={handleChange}
                            className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Transaction ID */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Transaction ID / Reference
                        </label>
                        <input
                            name="transactionId"
                            type="text"
                            value={form.transactionId}
                            onChange={handleChange}
                            placeholder="Optional"
                            className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Optional payment notes"
                            className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            rows={2}
                        />
                    </div>

                    {/* Payment Preview */}
                    {paymentAmount > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">After This Payment:</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Total Paid:</span>
                                    <span className="font-semibold text-blue-900">
                                        ₹{(order.AdvancePaid + paymentAmount).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Remaining Balance:</span>
                                    <span className={`font-semibold ${willBeFullyPaid ? 'text-green-600' : 'text-blue-900'}`}>
                                        ₹{newBalance.toLocaleString()}
                                    </span>
                                </div>
                                {willBeFullyPaid && (
                                    <div className="mt-2 p-2 bg-green-100 rounded text-green-800 text-xs font-medium text-center">
                                        ✓ Order will be marked as FULLY PAID
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-3 border-t">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                resetForm();
                            }}
                            className="bg-gray-300 px-5 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            {isConfirmation ? "Confirm & Record" : "Record Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
