import React from 'react'

export default function PayrollModal({ open, onClose, isBranch, targetName, summary, onConfirm }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Run Payroll</h3>
                <div className="space-y-3">
                    <div>Target: <strong>{targetName}</strong></div>
                    {summary ? (
                        <div>
                            <div className="text-sm text-gray-600">Employees processed: <strong>{summary.count}</strong></div>
                            <div className="text-sm text-gray-600">Total amount: <strong>₹ {Number(summary.total).toLocaleString()}</strong></div>
                            <div className="text-sm text-gray-600">Date: <strong>{summary.date}</strong></div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">This will run payroll and create payment records.</div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded bg-green-600 text-white">Run Payroll</button>
                </div>
            </div>
        </div>
    )
}
