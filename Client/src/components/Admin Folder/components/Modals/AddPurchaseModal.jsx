import React, { useState } from 'react'

export default function AddPurchaseModal({ open, onClose, onAdd }) {
    const [orderId, setOrderId] = useState('')
    const [purchaseTitle, setPurchaseTitle] = useState('')
    const [description, setDescription] = useState('')
    const [vendorName, setVendorName] = useState('')
    const [amount, setAmount] = useState('')
    const [paymentStatus, setPaymentStatus] = useState('Pending')
    const [status, setStatus] = useState('Unapproved')

    if (!open) return null

    function submit(e) {
        e.preventDefault()
        if (!orderId || !purchaseTitle || !amount) {
            alert('Please fill in all required fields (Order ID, Purchase Title, Amount)')
            return
        }

        onAdd({
            OrderId: orderId,
            PurchaseTitle: purchaseTitle,
            Description: description,
            VendorName: vendorName,
            Amount: Number(amount),
            PaymentStatus: paymentStatus,
            Status: status,
        })

        // Reset form
        setOrderId('')
        setPurchaseTitle('')
        setDescription('')
        setVendorName('')
        setAmount('')
        setPaymentStatus('Pending')
        setStatus('Unapproved')
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Add Purchase</h3>
                <form onSubmit={submit} className="grid grid-cols-1 gap-4">
                    {/* Order ID */}
                    <div>
                        <label className="text-sm text-gray-600">
                            Order ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={orderId}
                            onChange={e => setOrderId(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            placeholder="Enter Order ID"
                            required
                        />
                    </div>

                    {/* Purchase Title */}
                    <div>
                        <label className="text-sm text-gray-600">
                            Purchase Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={purchaseTitle}
                            onChange={e => setPurchaseTitle(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            placeholder="e.g., Freelancer Payment, Domain Purchase"
                            required
                        />
                    </div>

                    {/* Vendor Name and Amount */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-600">Vendor Name</label>
                            <input
                                value={vendorName}
                                onChange={e => setVendorName(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                                placeholder="Vendor name"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Status and Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-600">Payment Status</label>
                            <select
                                value={paymentStatus}
                                onChange={e => setPaymentStatus(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Approval Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                            >
                                <option value="Unapproved">Unapproved</option>
                                <option value="Approved">Approved</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm text-gray-600">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            rows={3}
                            placeholder="Additional details about the purchase..."
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Add Purchase
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
