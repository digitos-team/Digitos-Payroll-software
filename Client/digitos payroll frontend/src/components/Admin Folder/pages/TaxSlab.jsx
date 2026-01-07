import React, { useEffect, useState } from "react";
export default function TaxSlab({ slabs = [], onAddClick }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Tax Slabs</h3>
        <button
          onClick={onAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Tax Slab
        </button>
      </div>

      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Min Income</th>
            <th className="p-2 text-left">Max Income</th>
            <th className="p-2 text-left">Tax Rate (%)</th>
            <th className="p-2 text-left">Effective From</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>

        <tbody>
          {slabs.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">
                No tax slabs added.
              </td>
            </tr>
          ) : (
            slabs.map((s) => (
              <tr key={s._id || s.id}>
                <td className="p-2">₹{s.minIncome}</td>
                <td className="p-2">
                  {s.maxIncome === Infinity ? "∞" : `₹${s.maxIncome}`}
                </td>
                <td className="p-2">{s.taxRate}%</td>
                <td className="p-2">{s.effectiveFrom}</td>
                <td className="p-2">{s.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
