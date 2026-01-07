import React, { useState, useEffect } from 'react'
import { getOrdersApi } from '../../../../utils/api/orderapi'

export default function EditExpenseModal({ open, onClose, onUpdate, expense }) {
    const [orderId, setOrderId] = useState('')
    const [expenseTitle, setExpenseTitle] = useState('')
    const [expenseType, setExpenseType] = useState('Other')
    const [amount, setAmount] = useState('')
    const [expenseDate, setExpenseDate] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
    const [description, setDescription] = useState('')
    const [receipt, setReceipt] = useState(null)
    const [receiptPreview, setReceiptPreview] = useState(null)
    const [existingReceipt, setExistingReceipt] = useState(null)
    const [orders, setOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(false)

    // Populate form when expense changes
    useEffect(() => {
        if (expense && open) {
            setOrderId(expense.OrderId?._id || expense.OrderId || '')
            setExpenseTitle(expense.ExpenseTitle || '')
            setExpenseType(expense.ExpenseType || 'Other')
            setAmount(expense.Amount || '')
            setExpenseDate(expense.ExpenseDate ? new Date(expense.ExpenseDate).toISOString().slice(0, 10) : '')
            setPaymentMethod(expense.PaymentMethod || 'Bank Transfer')
            setDescription(expense.Description || '')
            setExistingReceipt(expense.Receipt || null)
            setReceipt(null)
            setReceiptPreview(null)
        }
    }, [expense, open])

    // Fetch orders when modal opens
    useEffect(() => {
        if (open) {
            fetchOrders()
        }
    }, [open])

    async function fetchOrders() {
        setLoadingOrders(true)
        try {
            const data = await getOrdersApi()
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching orders:', error)
            setOrders([])
        } finally {
            setLoadingOrders(false)
        }
    }

    if (!open || !expense) return null

    function handleFileChange(e) {
        const file = e.target.files[0]
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should not exceed 5MB')
                return
            }

            // Check file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
            if (!validTypes.includes(file.type)) {
                alert('Please upload a valid image (JPG, PNG, GIF) or PDF file')
                return
            }

            setReceipt(file)

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setReceiptPreview(reader.result)
                }
                reader.readAsDataURL(file)
            } else {
                setReceiptPreview('pdf')
            }
        }
    }

    function removeReceipt() {
        setReceipt(null)
        setReceiptPreview(null)
    }

    function removeExistingReceipt() {
        setExistingReceipt(null)
    }

    function submit(e) {
        e.preventDefault()
        if (!expenseTitle || !amount) {
            alert('Please fill in Expense Title and Amount')
            return
        }

        const updateData = {
            OrderId: orderId || null,
            ExpenseTitle: expenseTitle,
            ExpenseType: expenseType,
            Amount: Number(amount),
            ExpenseDate: expenseDate,
            PaymentMethod: paymentMethod,
            Description: description,
        }

        // Only include receipt if a new one was uploaded
        if (receipt) {
            updateData.Receipt = receipt
        }

        onUpdate(expense._id, updateData)
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Edit Expense</h3>
                <div className="grid grid-cols-1 gap-4">
                    {/* Expense Title */}
                    <div>
                        <label className="text-sm text-gray-600">
                            Expense Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={expenseTitle}
                            onChange={e => setExpenseTitle(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            placeholder="e.g., Office Supplies, Electricity Bill"
                            required
                        />
                    </div>

                    {/* Expense Type and Amount */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-600">Expense Type</label>
                            <select
                                value={expenseType}
                                onChange={e => setExpenseType(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                            >
                                <option value="Operational">Operational</option>
                                <option value="Administrative">Administrative</option>
                                <option value="Employee Welfare">Employee Welfare</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Salary">Salary</option>
                                <option value="Other">Other</option>
                            </select>
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

                    {/* Expense Date and Payment Method */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-600">Expense Date</label>
                            <input
                                type="date"
                                value={expenseDate}
                                onChange={e => setExpenseDate(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                            </select>
                        </div>
                    </div>

                    {/* Link to Order */}
                    <div>
                        <label className="text-sm text-gray-600">
                            Link to Order <span className="text-xs text-gray-400">(Optional)</span>
                        </label>
                        {loadingOrders ? (
                            <div className="w-full border rounded px-3 py-2 mt-1 text-gray-400">
                                Loading orders...
                            </div>
                        ) : (
                            <select
                                value={orderId}
                                onChange={e => setOrderId(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-1"
                            >
                                <option value="">-- Select Order (Optional) --</option>
                                {orders.map(order => (
                                    <option key={order._id} value={order._id}>
                                        {order.ServiceTitle} - {order.ClientName || 'N/A'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Existing Receipt */}
                    {existingReceipt && !receipt && (
                        <div>
                            <label className="text-sm text-gray-600">Current Receipt</label>
                            <div className="border rounded-lg p-3 mt-1">
                                <div className="flex items-center justify-between">
                                    <a
                                        href={existingReceipt}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        View Current Receipt
                                    </a>
                                    <button
                                        type="button"
                                        onClick={removeExistingReceipt}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload New Receipt */}
                    <div>
                        <label className="text-sm text-gray-600">
                            {existingReceipt ? 'Upload New Receipt (Optional)' : 'Upload Receipt'}
                        </label>
                        <div className="mt-1">
                            {!receipt ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="mb-1 text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-400">PNG, JPG, GIF or PDF (MAX. 5MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            ) : (
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {receiptPreview === 'pdf' ? (
                                                <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <img
                                                    src={receiptPreview}
                                                    alt="Receipt preview"
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{receipt.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(receipt.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeReceipt}
                                            className="text-red-600 hover:text-red-700 p-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
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
                            placeholder="Additional details about the expense..."
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
                            type="button"
                            onClick={submit}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Update Expense
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
