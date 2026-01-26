import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiX } from "react-icons/fi";
import { getHolidays, addHoliday, updateHoliday, deleteHoliday } from "../../../utils/api/holidayApi";

const Holidays = () => {
    const { companyId } = useSelector((state) => state.auth);
    const actualCompanyId = companyId?._id || companyId;

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({ Name: "", Date: "" });

    const loadHolidays = async () => {
        if (!actualCompanyId) return;
        setLoading(true);
        try {
            const res = await getHolidays(actualCompanyId);
            if (res.success) {
                // Filter by selected year
                const filtered = (res.data || []).filter(h =>
                    h.Date?.startsWith(String(selectedYear))
                );
                setHolidays(filtered);
            }
        } catch (err) {
            console.error("Error loading holidays:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHolidays();
    }, [actualCompanyId, selectedYear]);

    const openAddModal = () => {
        setEditingHoliday(null);
        setFormData({ Name: "", Date: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (holiday) => {
        setEditingHoliday(holiday);
        setFormData({ Name: holiday.Name, Date: holiday.Date });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHoliday(null);
        setFormData({ Name: "", Date: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHoliday) {
                await updateHoliday({
                    HolidayId: editingHoliday._id,
                    Name: formData.Name,
                    Date: formData.Date
                });
            } else {
                await addHoliday({
                    CompanyId: actualCompanyId,
                    Name: formData.Name,
                    Date: formData.Date
                });
            }
            closeModal();
            loadHolidays();
        } catch (err) {
            alert(err.message || "Failed to save holiday");
        }
    };

    const handleDelete = async (holidayId) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;
        try {
            await deleteHoliday(holidayId);
            loadHolidays();
        } catch (err) {
            alert(err.message || "Failed to delete holiday");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
        years.push(y);
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                        <FiCalendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Holidays</h2>
                        <p className="text-sm text-gray-500">Manage company holidays</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                    <FiPlus className="w-5 h-5" />
                    Add Holiday
                </button>
            </div>

            {/* Year Filter */}
            <div className="mb-6">
                <div className="inline-flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                    {years.map((year) => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedYear === year
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* Holidays Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        Loading holidays...
                    </div>
                ) : holidays.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiCalendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No holidays found for {selectedYear}</p>
                        <p className="text-sm">Click "Add Holiday" to create one</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Holiday Name</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {holidays.map((holiday) => (
                                <tr key={holiday._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className="font-medium text-gray-800">{holiday.Name}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-gray-600">{formatDate(holiday.Date)}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            {holiday.Type || "Paid"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(holiday)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(holiday._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Holiday Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.Name}
                                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="e.g., Diwali, Independence Day"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.Date}
                                    onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                >
                                    {editingHoliday ? "Update" : "Add"} Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Holidays;
