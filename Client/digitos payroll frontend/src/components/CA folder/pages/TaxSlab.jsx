import React, { useEffect, useState } from "react";
import { fetchTaxSlabs } from "../../../utils/CA api/CaApi"; // adjust path if needed
import CALayout from "../layouts/CALayout";
import { Loader, AlertCircle } from "lucide-react";

export default function TaxSlab({ companyId, deadlines = [] }) {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSlabs() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTaxSlabs(companyId);
        setSlabs(data);
      } catch (err) {
        setError("Failed to load tax slabs.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSlabs();
  }, [companyId]);

  if (loading) {
    return (
      <CALayout deadlines={deadlines}>
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      </CALayout>
    );
  }

  if (error) {
    return (
      <CALayout deadlines={deadlines}>
        <div className="p-4 bg-red-100 text-red-800 rounded flex items-center gap-2">
          <AlertCircle />
          <span>{error}</span>
        </div>
      </CALayout>
    );
  }

  return (
    <CALayout deadlines={deadlines}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Tax Slabs</h2>

        {slabs.length === 0 ? (
          <p>No tax slabs available.</p>
        ) : (
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Min Income</th>
                <th className="border border-gray-300 p-2">Max Income</th>
                <th className="border border-gray-300 p-2">Tax Rate (%)</th>
                <th className="border border-gray-300 p-2">Description</th>
              </tr>
            </thead>

            <tbody>
              {slabs.map((slab) => (
                <tr key={slab._id}>
                  <td className="border border-gray-300 p-2">
                    {slab.minIncome != null ? `₹${slab.minIncome.toLocaleString()}` : "—"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {slab.maxIncome != null ? `₹${slab.maxIncome.toLocaleString()}` : "∞"}
                  </td>
                  <td className="border border-gray-300 p-2">{slab.taxRate}%</td>
                  <td className="border border-gray-300 p-2">
                    {slab.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
    </CALayout>
  );
}

