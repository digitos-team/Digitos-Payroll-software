import React, { useState } from 'react';

export default function AddSalaryHeadModal({ open, onClose, onAdd }) {
    const [title, setTitle] = useState('');
    const [shortName, setShortName] = useState('');
    const [type, setType] = useState('Earnings');
    const [method, setMethod] = useState('Fixed');
    const [dependOn, setDependOn] = useState('');

    if (!open) return null;

    function submit(e) {
        e.preventDefault();
        if (!title || !shortName) return;

        const payload = {
            SalaryHeadsTitle: title,
            ShortName: shortName,
            SalaryHeadsType: type,
            SalaryCalcultateMethod: method,
            DependOn: dependOn
        };

        onAdd(payload);

        // Reset form
        setTitle('');
        setShortName('');
        setType('Earnings');
        setMethod('Fixed');
        setDependOn('');
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Add Salary Head</h3>
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600">Salary Head Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" required />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Short Name</label>
                        <input value={shortName} onChange={(e) => setShortName(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" required />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded px-3 py-2 mt-1">
                            <option value="Earnings">Earnings</option>
                            <option value="Deductions">Deductions</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Add Salary Head</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
