import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getDesignationsByCompany } from "../utils/api/DepartmentApi";

export default function Designation() {
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { companyId } = useSelector((state) => state.auth);

    // Extract the actual company ID string from the companyId object
    const actualCompanyId = companyId?._id || companyId;

    useEffect(() => {
        const fetchDesignations = async () => {
            try {
                const res = await getDesignationsByCompany(actualCompanyId);
                const data = res.data?.data || res.data || [];
                setDesignations(data);
            } catch (err) {
                console.error("Error fetching designations:", err);
            } finally {
                setLoading(false);
            }
        };

        if (actualCompanyId) {
            fetchDesignations();
        }
    }, [actualCompanyId]);

    return (
        <div className="p-6">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold">Designations</h2>
                <p className="text-sm text-gray-500">
                    View company designations and hierarchy levels
                </p>
            </header>

            {loading ? (
                <p className="text-gray-500">Loading designations...</p>
            ) : designations.length === 0 ? (
                <p className="text-gray-500">No designations available.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {designations.map((d) => (
                        <div
                            key={d._id || d.id || Math.random()}
                            className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition"
                        >
                            <div className="font-medium text-gray-800 text-lg mb-1">
                                {d.DesignationName || d.name || "Unnamed Designation"}
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                                Level: {d.Level || "N/A"}
                            </div>
                            <div className="text-sm text-gray-600">
                                {d.Description || "No description available"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
