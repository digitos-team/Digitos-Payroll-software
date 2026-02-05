import React, { useEffect, useState } from "react";
import {
  addDesignation,
  deleteDesignation,
  getDesignationsByCompany,
} from "../../../utils/api/departmentapi";
import AddDesignationModal from "../components/Modals/AddDesignationModal";

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch designations from API
  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const res = await getDesignationsByCompany();
      // Handle both cases: array returned directly or wrapped in `data`
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setDesignations(data);
    } catch (err) {
      console.error("Error fetching designations:", err);
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  // Add a new designation
  const handleAdd = async (data) => {
    try {
      await addDesignation(data); // add to DB
      fetchDesignations(); // refetch full list
    } catch (err) {
      console.error("Error adding designation:", err);
    }
  };

  // Delete a designation
  // Update handleDelete function
  const handleDelete = async (id) => {


    if (!window.confirm("Are you sure you want to delete this designation?")) {

      return;
    }



    try {

      const response = await deleteDesignation(id);


      setDesignations((prev) => prev.filter((d) => d._id !== id));
      alert("Designation deleted successfully!");
    } catch (err) {
      console.error("Error deleting designation:", err);
      alert("Failed to delete designation");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-semibold">Designations</h2>
        <p className="text-sm text-gray-500">
          Manage company designations and hierarchy levels
        </p>
      </header>

      {/* Designation List */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Designation List</h3>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Add Designation
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 mt-4">Loading...</p>
        ) : !Array.isArray(designations) || designations.length === 0 ? (
          <p className="text-gray-500 mt-4">No designations available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {designations.map((d) => (
              <div
                key={d._id || Math.random()}
                className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {d.DesignationName || "Unnamed Designation"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {d.Level || "No level defined"}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleDelete(d._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {d.Description || "No description provided"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Designation Modal */}
      <AddDesignationModal
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
