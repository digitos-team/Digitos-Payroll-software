// import { useBranches } from "../context/BranchContext";
import React from "react";
import { useBranches } from "../context/BranchContext";

export default function BranchList() {
  const { branches, loading } = useBranches();

  if (loading) return <p className="p-6">Loading branches...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#345B87] mb-4">All Branches</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b._id} className="bg-white p-4 rounded-xl shadow border">
            <h3 className="text-lg font-semibold text-[#345B87]">{b.BranchName}</h3>
            <p className="text-sm text-gray-600">Address: {b.BranchAddress}</p>
            <p className="text-sm text-gray-600">Location: {b.BranchCity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
