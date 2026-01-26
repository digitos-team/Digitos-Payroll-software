
import React, { useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { useBranches } from '../context/BranchContext';
import AddDepartmentModal from '../components/Modals/AddDepartmentModal';

export default function Departments() {
    const { departments = [], addDepartment, deleteDepartment, employeeCountByDept = [] } = useBranches();
    const [open, setOpen] = useState(false);

    const handleAdd = (data) => {
        addDepartment(data);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            await deleteDepartment(id);
        }
    };

    // Helper function to get employee count for a department
    const getEmployeeCount = (departmentId) => {
        const deptData = employeeCountByDept.find(
            (item) => String(item.DepartmentId) === String(departmentId)
        );
        return deptData?.totalEmployees || 0;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h2 className="text-2xl font-semibold">Departments</h2>
                <p className="text-sm text-gray-500">
                    Manage departments, roles and responsibilities
                </p>
            </header>

            {/* Department Section */}
            <section>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Department List</h3>
                    <button
                        onClick={() => setOpen(true)}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        Add Department
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {departments.length === 0 ? (
                        <p className="text-gray-500 col-span-full">No departments available.</p>
                    ) : (
                        departments.map((d) => {
                            const empCount = getEmployeeCount(d.id);

                            return (
                                <div
                                    key={d.id || Math.random()}
                                    className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-800">
                                                {d.name || 'Unnamed Department'}
                                            </div>
                                            {/* <div className="text-sm text-gray-500">
                                                {d.roles?.length > 0
                                                    ? d.roles.join(', ')
                                                    : 'No roles assigned'}
                                            </div> */}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(d.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                                            title="Delete Department"
                                        >
                                            <MdDelete size={20} />
                                        </button>
                                    </div>
                                    <div className="mt-3 text-sm text-gray-600">
                                        {d.responsibilities || 'No responsibilities defined'}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Add Department Modal */}
            <AddDepartmentModal
                open={open}
                onClose={() => setOpen(false)}
                onAdd={(data) => {
                    handleAdd(data);
                    setOpen(false);
                }}
            />
        </div>
    );
}
