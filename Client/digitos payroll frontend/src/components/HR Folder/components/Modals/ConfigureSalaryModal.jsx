import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

export default function ConfigureSalaryModal({ open, onClose, employee, salaryHeads, onSave }) {
    const [salarySettings, setSalarySettings] = useState({});
    const [effectFrom, setEffectFrom] = useState(new Date().toISOString().split('T')[0]);
    const [isTaxApplicable, setIsTaxApplicable] = useState(false);

    if (!open || !employee) return null;

    const handleInputChange = (headId, field, value) => {
        setSalarySettings(prev => ({
            ...prev,
            [headId]: {
                ...prev[headId],
                [field]: value
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare data for API - matching backend expected format
        // Backend expects 'applicableValue' (not 'Amount') and 'percentage'
        const salaryData = Object.entries(salarySettings).map(([headId, data]) => ({
            SalaryHeadId: headId,
            applicableValue: parseFloat(data.amount) || 0,
            percentage: parseFloat(data.percentage) || 0
        }));

        // Send data matching backend controller expectations
        onSave({
            EmployeeID: employee._id,  // Capital D as expected by backend
            EffectFrom: effectFrom,
            SalaryHeads: salaryData,
            isTaxApplicable: isTaxApplicable
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Configure Salary for {employee.Name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.Email} - {employee.Department}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Effect From Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Effective From
                            </label>
                            <input
                                type="date"
                                value={effectFrom}
                                onChange={(e) => setEffectFrom(e.target.value)}
                                className="w-full border dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                required
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isTaxApplicable}
                                    onChange={(e) => setIsTaxApplicable(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Tax Applicable
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Salary Components</h4>

                        {salaryHeads.map((head) => (
                            <div
                                key={head._id}
                                className="border dark:border-gray-700 rounded-lg p-4 space-y-3"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                            {head.SalaryHeadsTitle}
                                        </h5>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {head.ShortName} - {head.SalaryHeadsType}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${head.SalaryHeadsType === 'Earnings'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                        {head.SalaryHeadsType}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-300">
                                            Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={salarySettings[head._id]?.amount || ''}
                                            onChange={(e) => handleInputChange(head._id, 'amount', e.target.value)}
                                            className="w-full border dark:border-gray-600 rounded px-3 py-2 mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-300">
                                            Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={salarySettings[head._id]?.percentage || ''}
                                            onChange={(e) => handleInputChange(head._id, 'percentage', e.target.value)}
                                            className="w-full border dark:border-gray-600 rounded px-3 py-2 mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {head.SalaryCalcultateMethod && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Calculation Method: {head.SalaryCalcultateMethod}
                                        {head.DependOn && ` | Depends on: ${head.DependOn}`}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}