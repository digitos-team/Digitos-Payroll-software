import React, { useState } from 'react'

export default function RevenueModal({ open, onClose, branches = [], onAdd }) {
    const [source, setSource] = useState('')
    const [amount, setAmount] = useState('')
    const [revenueDate, setRevenueDate] = useState(new Date().toISOString().slice(0, 10))
    const [description, setDescription] = useState('')
    const [addedBy, setAddedBy] = useState('Admin')
    const [branchId, setBranchId] = useState(branches[0]?.id || '')

    if (!open) return null

    function submit(e) {
        e.preventDefault()
        if (!source || !amount) return
onAdd({
//   CompanyId,                       // auto from redux
  OrderId: null,                   // unless you add dropdown
  Source: source,                  // from modal input
  Amount: Number(amount),
  RevenueDate: revenueDate,
  Description: description,
  AddedBy: addedBy || null,
});

        setSource('')
        setAmount('')
        setRevenueDate(new Date().toISOString().slice(0, 10))
        setDescription('')
        setAddedBy('Admin')
        setBranchId(branches[0]?.id || '')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Add Revenue</h3>
                <form onSubmit={submit} className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-sm text-gray-600">Source</label>
                        <input value={source} onChange={e => setSource(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm text-gray-600">Revenue Date</label>
                            <input type="date" value={revenueDate} onChange={e => setRevenueDate(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Added by</label>
                            <input value={addedBy} onChange={e => setAddedBy(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" rows={3} />
                    </div>



                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Add Revenue</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
