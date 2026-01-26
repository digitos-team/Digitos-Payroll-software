import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getDepartmentsByCompany } from "../utils/api/DepartmentApi";

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { companyId } = useSelector((state) => state.auth);

    // Extract the actual company ID string from the companyId object
    const actualCompanyId = companyId?._id || companyId;

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await getDepartmentsByCompany(actualCompanyId);
                const data = res.data?.data || res.data || [];
                setDepartments(data);
            } catch (err) {
                console.error("Error fetching departments:", err);
            } finally {
                setLoading(false);
            }
        };

        if (actualCompanyId) {
            fetchDepartments();
        }
    }, [actualCompanyId]);

    return (
        <div className="p-6">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold">Departments</h2>
                <p className="text-sm text-gray-500">
                    View company departments and responsibilities
                </p>
            </header>

            {loading ? (
                <p className="text-gray-500">Loading departments...</p>
            ) : departments.length === 0 ? (
                <p className="text-gray-500">No departments available.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((d) => (
                        <div
                            key={d._id || d.id || Math.random()}
                            className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition"
                        >
                            <div className="font-medium text-gray-800 text-lg mb-2">
                                {d.DepartmentName || d.name || "Unnamed Department"}
                            </div>
                            <div className="text-sm text-gray-600">
                                {d.Description || d.responsibilities || "No description available"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
