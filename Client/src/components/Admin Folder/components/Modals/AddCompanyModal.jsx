
import React, { useState } from 'react'

export default function AddCompanyModal({ open, onClose, onAdd }) {
    const [branchName, setBranchName] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [pinCode, setPinCode] = useState('')

    if (!open) return null

    function submit(e) {
        e.preventDefault()

        if (!branchName) return

        // Send data with capitalized field names matching backend schema
        onAdd({
            BranchName: branchName,
            BranchAddress: address,
            BranchCity: city,
            BranchState: state,
            BranchPinCode: parseInt(pinCode) || 0  // Convert to number as per schema
        })

        // Reset form
        setBranchName('')
        setAddress('')
        setCity('')
        setState('')
        setPinCode('')
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Add Branch</h3>

                <form onSubmit={submit} className="space-y-3">

                    {/* Branch Name */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">Branch Name</label>
                        <input
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">Address</label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">City</label>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">State</label>
                        <input
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Pin Code */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">Pin Code</label>
                        <input
                            type="number"
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            Add
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}