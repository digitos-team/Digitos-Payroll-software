import React, { useState } from 'react'

export default function AddTaxSlabModal({ open, onClose, onAdd }) {

    const [minIncome, setMinIncome] = useState('')
    const [maxIncome, setMaxIncome] = useState('')
    const [taxRate, setTaxRate] = useState('')
    const [description, setDescription] = useState('')
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))

    if (!open) return null

    function submit(e) {
        e.preventDefault()
        if (!minIncome || !maxIncome || !taxRate) return

        onAdd({
            id: Date.now(),
            minIncome: Number(minIncome),
            maxIncome: Number(maxIncome),
            taxRate: Number(taxRate),
            description,
            effectiveFrom
        })

        onClose()
        setMinIncome('')
        setMaxIncome('')
        setTaxRate('')
        setDescription('')
        setEffectiveFrom(new Date().toISOString().slice(0, 10))
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Add Tax Slab</h2>
                
                <form onSubmit={submit} className="grid grid-cols-2 gap-4">

                    <div>
                        <label className="text-sm">Min Income</label>
                        <input 
                            type="number"
                            value={minIncome}
                            onChange={e => setMinIncome(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Max Income</label>
                        <input 
                            type="number"
                            value={maxIncome}
                            onChange={e => setMaxIncome(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Tax Rate (%)</label>
                        <input 
                            type="number"
                            value={taxRate}
                            onChange={e => setTaxRate(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-sm">Effective From</label>
                        <input 
                            type="date"
                            value={effectiveFrom}
                            onChange={e => setEffectiveFrom(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-sm">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            rows={2}
                        />
                    </div>

                    <div className="col-span-2 flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                            Add
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
