import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiSettings, FiSave, FiCheck } from "react-icons/fi";
import { getLeaveSettings, updateLeaveSettings } from "../../../utils/api/leaveSettingsApi";

const LeaveSettings = () => {
    const { companyId } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;

    const [settings, setSettings] = useState({ DefaultMonthlyPaidLeaves: 1 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [inputValue, setInputValue] = useState(1);

    const loadSettings = async () => {
        if (!actualCompanyId) return;
        setLoading(true);
        try {
            const res = await getLeaveSettings(actualCompanyId);
            if (res.success && res.data) {
                setSettings(res.data);
                setInputValue(res.data.DefaultMonthlyPaidLeaves || 1);
            }
        } catch (err) {
            console.error("Error loading leave settings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [actualCompanyId]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await updateLeaveSettings({
                CompanyId: actualCompanyId,
                DefaultMonthlyPaidLeaves: Number(inputValue)
            });
            setSettings({ ...settings, DefaultMonthlyPaidLeaves: Number(inputValue) });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert(err.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FiSettings className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Leave Settings</h2>
                    <p className="text-sm text-gray-500">Configure global leave policies</p>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-400">Loading settings...</p>
                </div>
            ) : (
                <div className="max-w-2xl">
                    {/* Settings Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Leave Allowance</h3>

                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Default Paid Leaves Per Month
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-xs">
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                        days
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                This is the number of paid leaves allocated to each employee every month.
                                Unused leaves will be counted as unpaid if taken beyond this limit.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">How it works:</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Each employee gets this many paid leaves per month</li>
                                <li>• When employees apply for leave, HR can approve/reject</li>
                                <li>• Approved leaves deduct from the monthly balance</li>
                                <li>• Leaves beyond this limit are marked as unpaid</li>
                                <li>• Unpaid leaves result in salary deduction</li>
                            </ul>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSave}
                                disabled={saving || inputValue === settings.DefaultMonthlyPaidLeaves}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${saving || inputValue === settings.DefaultMonthlyPaidLeaves
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg"
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-4 h-4" />
                                        Save Settings
                                    </>
                                )}
                            </button>

                            {saved && (
                                <div className="flex items-center gap-2 text-emerald-600 animate-fade-in">
                                    <FiCheck className="w-5 h-5" />
                                    <span className="font-medium">Settings saved successfully!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Value Display */}
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500 mb-1">Monthly Paid Leaves</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {settings.DefaultMonthlyPaidLeaves}
                                    <span className="text-lg font-normal text-gray-400 ml-1">days</span>
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500 mb-1">Annual Paid Leaves</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {settings.DefaultMonthlyPaidLeaves * 12}
                                    <span className="text-lg font-normal text-gray-400 ml-1">days</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveSettings;
