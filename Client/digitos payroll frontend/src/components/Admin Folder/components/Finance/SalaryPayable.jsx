import React from 'react'

export default function SalaryPayable({ items = [] }) {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Salary Payable</h3>
            <div className="space-y-3 max-h-[300px] overflow-auto">
                {items.map(i => (
                    <div key={i.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                            <div className="font-medium text-gray-800">{i.employee}</div>
                            <div className="text-sm text-gray-500">Due: {i.due}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-800 font-semibold">₹ {i.amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Pending</div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-gray-500">No salary payable items.</div>
                )}
            </div>
        </div>
    )
}
