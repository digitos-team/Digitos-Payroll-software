import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { getBranchesByCompany } from "../utils/api/BranchApi";

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { companyId } = useSelector((state) => state.auth);

    // Extract the actual company ID string from the companyId object
    const actualCompanyId = companyId?._id || companyId;

    // Fetch branches
    const fetchBranches = useCallback(async () => {
        try {
            const res = await getBranchesByCompany(actualCompanyId);
            const data = res.data?.data || res.data || [];
            setBranches(data);
        } catch (err) {
            console.error("Error fetching branches:", err);
        }
    }, [actualCompanyId]);

    useEffect(() => {
        const loadData = async () => {
            if (actualCompanyId) {
                setLoading(true);
                await fetchBranches();
                setLoading(false);
            }
        };
        loadData();
    }, [actualCompanyId, fetchBranches]);

    return (
        <div className="p-6">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Branches</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    View company branches
                </p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="ml-3 text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            ) : (
                <>
                    {/* Branches Grid */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        All Branches ({branches.length})
                    </h3>

                    {branches.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No branches available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {branches.map((b) => (
                                <div
                                    key={b._id || b.id || Math.random()}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition"
                                >
                                    <div className="font-medium text-gray-800 dark:text-white text-lg mb-1">
                                        {b.BranchName || b.name || "Unnamed Branch"}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <span className="font-medium">Location:</span> {b.BranchCity || b.City || b.city || "N/A"}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Address:</span> {b.BranchAddress || b.Address || b.address || "N/A"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
