import React, { useState } from 'react'

export default function ExpenseModal({ open, onClose, branches = [], orders = [], onAdd }) {
    const [title, setTitle] = useState('')
    const [type, setType] = useState('Operational')
    const [amount, setAmount] = useState('')
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
    const [paymentMethod, setPaymentMethod] = useState('Cash')
    const [vendorName, setVendorName] = useState('')
    const [invoiceName, setInvoiceName] = useState('')
    const [description, setDescription] = useState('')
    const [billFile, setBillFile] = useState(null)
    const [addedBy, setAddedBy] = useState('Admin')
    const [status, setStatus] = useState('pending')
    const [branchId, setBranchId] = useState(branches[0]?.id || '')
    const [orderId, setOrderId] = useState('')

    if (!open) return null

    function submit(e) {
        e.preventDefault()
        if (!title || !amount) return

        const bill = billFile ? billFile.name : null

        onAdd({
            title,
            type,
            amount: Number(amount),
            date: expenseDate,
            paymentMethod,
            vendorName,
            invoiceName,
            description,
            bill,
            addedBy,
            status,
            branchId: branchId || null,
            orderId: orderId || null,
        })

        setTitle('')
        setType('Operational')
        setAmount('')
        setExpenseDate(new Date().toISOString().slice(0, 10))
        setPaymentMethod('Cash')
        setVendorName('')
        setInvoiceName('')
        setDescription('')
        setBillFile(null)
        setAddedBy('Admin')
        setStatus('pending')
        setBranchId(branches[0]?.id || '')
        setOrderId('')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl p-6 max-h-[85vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Add Expense</h3>

                <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    {/* Title */}
                    <div className="col-span-2 md:col-span-3">
                        <label className="text-sm">Title</label>
                        <input 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    {/* Type + Amount */}
                    <div>
                        <label className="text-sm">Expense Type</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded px-3 py-2 mt-1">
                            <option>Operational</option>
                            <option>Administrative</option>
                            <option>Employee Welfare</option>
                            <option>Maintenance</option>
                            <option>Utilities</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm">Amount</label>
                        <input 
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    {/* Date + Payment */}
                    <div>
                        <label className="text-sm">Expense Date</label>
                        <input 
                            type="date"
                            value={expenseDate}
                            onChange={e => setExpenseDate(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Payment Method</label>
                        <input 
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    {/* Vendor */}
                    {/* <div>
                        <label className="text-sm">Vendor Name</label>
                        <input 
                            value={vendorName}
                            onChange={e => setVendorName(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div> */}

                    {/* Order */}
                    <div>
                        <label className="text-sm">Order (optional)</label>
                        <select 
                            value={orderId}
                            onChange={e => setOrderId(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        >
                            <option value="">None</option>
                            {orders.map(o => (
                                <option key={o.id} value={o.id}>{o.title} — ₹ {o.amount}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-sm">Status</label>
                        <select 
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        >
                            <option value="pending">pending</option>
                            <option value="verified">verified</option>
                            <option value="rejected">rejected</option>
                        </select>
                    </div>

                    {/* Bill + Added by */}
                    <div>
                        <label className="text-sm">Bill Attachment</label>
                        <input 
                            type="file"
                            onChange={e => setBillFile(e.target.files?.[0] || null)}
                            className="w-full mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Added By</label>
                        <input 
                            value={addedBy}
                            onChange={e => setAddedBy(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    {/* Description full row */}
                    <div className="col-span-2 md:col-span-3">
                        <label className="text-sm">Description</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="col-span-2 md:col-span-3 flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
                            Add Expense
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
