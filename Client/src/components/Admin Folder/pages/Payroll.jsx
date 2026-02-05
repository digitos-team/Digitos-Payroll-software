import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import AddSalaryHeadModal from '../components/Modals/AddSalaryHeadModal'
import { addSalaryHead, fetchSalaryHeads, deleteSalaryHead } from '../../../utils/api/salaryheads'

export default function Payroll() {
    const [heads, setHeads] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { companyId } = useSelector((state) => state.auth)

    useEffect(() => {
        if (companyId) {
            loadHeads()
        }
    }, [companyId])

    const loadHeads = async () => {
        try {
            const data = await fetchSalaryHeads(companyId);

            setHeads(data);
        } catch (error) {
            console.error("Failed to load salary heads", error);
        }
    }

    const handleAdd = async (data) => {
        try {
            await addSalaryHead(data, companyId)
            loadHeads()
        } catch (error) {
            console.error("Failed to add salary head", error)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this salary head?")) return
        try {
            await deleteSalaryHead(id, companyId)
            loadHeads()
        } catch (error) {
            console.error("Failed to delete salary head", error)
        }
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold">Payroll - Salary Heads</h2>
                    <p className="text-sm text-gray-500">Create salary heads (earning or deduction). These will be used when building payroll rules.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded bg-blue-600 text-white">Add Salary Head</button>
            </header>

            <section>
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-3">Defined Salary Heads</h3>
                    {heads.length === 0 ? (
                        <div className="text-gray-500">No salary heads defined yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {heads.map(h => (
                                <div key={h._id} className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <div className="font-medium">{h.SalaryHeadsTitle} <span className="text-sm text-gray-500">({h.ShortName})</span></div>
                                        <div className="text-sm text-gray-500">{h.SalaryHeadsType} - {h.SalaryCalcultateMethod}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-gray-600">ID: {h._id}</div>
                                        <button onClick={() => handleDelete(h._id)} className="text-red-500 hover:text-red-700">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <AddSalaryHeadModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAdd}
            />
        </div>
    )
}
