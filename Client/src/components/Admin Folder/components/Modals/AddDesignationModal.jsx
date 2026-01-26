import React, { useState } from 'react';

const LEVELS = ["Junior", "Mid", "Senior", "Manager", "Director"];

export default function AddDesignationModal({ open, onClose, onAdd }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('Junior');

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        if (!name) return;

        onAdd({ DesignationName: name, Description: description, Level: level });

        // Reset form
        setName('');
        setDescription('');
        setLevel('Junior');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Add Designation</h3>
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600">Designation Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            placeholder="e.g. Software Engineer"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                            rows={3}
                            placeholder="Optional description"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Level</label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1"
                        >
                            {LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white"
                        >
                            Add Designation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
