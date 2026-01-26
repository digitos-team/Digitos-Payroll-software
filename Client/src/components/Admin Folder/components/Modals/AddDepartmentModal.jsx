import React, { useState } from 'react'

export default function AddDepartmentModal({ open, onClose, onAdd }) {
    const [name, setName] = useState('')
    const [rolesCsv, setRolesCsv] = useState('')
    const [responsibilities, setResponsibilities] = useState('')

    if (!open) return null

 function submit(e) {
    e.preventDefault()
    if (!name) return

    const roles = rolesCsv.split(',').map(s => s.trim()).filter(Boolean)

    // Prepare data according to API
    const payload = {
        DepartmentName: name,
        Description: responsibilities,
        Roles: roles  // optional, only if your schema has a Roles field
    }

    onAdd(payload)  // Call parent handler which calls API
    // Reset form
    setName('')
    setRolesCsv('')
    setResponsibilities('')
    onClose()
}

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Add Department</h3>
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600">Department Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Roles (comma separated)</label>
                        <input value={rolesCsv} onChange={(e) => setRolesCsv(e.target.value)} placeholder="e.g. Manager, Analyst" className="w-full border rounded px-3 py-2 mt-1" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Responsibilities</label>
                        <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" rows={4} />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Add Department</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
