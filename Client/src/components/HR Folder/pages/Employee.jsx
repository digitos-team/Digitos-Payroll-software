import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiEdit, FiTrash2, FiSearch, FiEye } from "react-icons/fi";
import { getAllEmployees, deleteUser, updateUser } from "../utils/api/EmployeeApi";
import { addEmployee } from "../../../utils/api/employeeapi";
import AddEmployeeModal from "../components/Modals/AddEmployeeModal";
import EditEmployeeModal from "../components/Modals/EditEmployeeModal";
import { getAssetUrl } from '../../../utils/config';

const Employee = () => {
  const navigate = useNavigate();
  const { companyId, user } = useSelector((state) => state.auth);
  // Extract the actual company ID string from the companyId object
  const actualCompanyId = companyId?._id || companyId;

  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]); // backend data

  const loadEmployees = async () => {
    try {
      if (!actualCompanyId) return;
      const { data } = await getAllEmployees(actualCompanyId);
      if (data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  // Fetch employees from backend
  useEffect(() => {
    if (actualCompanyId) {
      loadEmployees();
    }
  }, [actualCompanyId]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await deleteUser(id);
      loadEmployees(); // Refresh list
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  };



  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddEmployee = async (formData) => {
    try {
      // Add createdBy field from logged-in user
      // NOTE: formData is already a FormData object from AddEmployeeModal
      // We cannot spread FormData with ..., so append createdBy directly
      if (user?._id || user?.id) {
        formData.append("createdBy", user?._id || user?.id);
      }

      // Append user name for Activity Log
      const userName = user?.name || user?.Name || user?.FullName;
      if (userName) {
        formData.append("ActionBy", userName);
        formData.append("CreatedByName", userName);
      }

      console.log("Submitting employee FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      console.log("Company ID:", actualCompanyId);

      await addEmployee(formData, actualCompanyId);
      alert("Employee added successfully!");
      loadEmployees(); // Refresh list
    } catch (err) {
      console.error("Error adding employee:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert("Failed to add employee");
    }
  };

  const handleUpdateEmployee = async (id, formData) => {
    try {
      await updateUser(id, formData);
      alert("Employee updated successfully!");
      loadEmployees(); // Refresh list
      setIsEditModalOpen(false); // Close modal
    } catch (err) {
      console.error("Error updating employee:", err);
      alert("Failed to update employee");
    }
  };

  // Filter by search
  const filteredEmployees = employees.filter((emp) =>
    emp.Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Employee Directory</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end mb-4">
        <div className="relative w-72">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-gray-600">Photo</th>
              <th className="py-3 px-4 text-gray-600">Name</th>
              <th className="py-3 px-4 text-gray-600">Emp Code</th>
              <th className="py-3 px-4 text-gray-600">Email</th>
              <th className="py-3 px-4 text-gray-600">Department</th>
              <th className="py-3 px-4 text-gray-600">Type</th>
              <th className="py-3 px-4 text-gray-600">Role</th>
              <th className="py-3 px-4 text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp._id} className="border-t">
                <td className="py-3 px-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {emp.ProfilePhoto ? (
                      <img
                        src={getAssetUrl(emp.ProfilePhoto)}
                        alt={emp.Name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerText = emp.Name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        }}
                      />
                    ) : (
                      <span className="text-sm">
                        {emp.Name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">{emp.Name}</td>
                <td className="py-3 px-4 text-gray-600">{emp.EmployeeCode || "-"}</td>
                <td className="py-3 px-4 text-gray-600">{emp.Email}</td>
                <td className="py-3 px-4">{emp.DepartmentId?.DepartmentName || "-"}</td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">{emp.EmployeeType || "-"}</span>
                </td>
                <td className="py-3 px-4 capitalize">
                  <span className={`px-3 py-1 rounded-full text-sm ${emp.role === "CA" ? "bg-purple-100 text-purple-700" :
                    emp.role === "HR" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                    {emp.role}
                  </span>
                </td>

                <td className="py-3 px-4 flex gap-3">
                  <button
                    className="text-gray-600 hover:text-blue-600"
                    onClick={() => navigate(`/hr/employees/${emp._id}`)}
                    title="View Details"
                  >
                    <FiEye size={18} />
                  </button>

                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleEdit(emp)}
                    title="Edit"
                  >
                    <FiEdit size={18} />
                  </button>

                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(emp._id)}
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr >
            ))}

            {/* If No Data */}
            {
              filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-gray-400">
                    No employees found
                  </td>
                </tr>
              )
            }
          </tbody >
        </table >
      </div >

      <AddEmployeeModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddEmployee}
      />

      <EditEmployeeModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateEmployee}
        employee={selectedEmployee}
      />
    </div >
  );
};

export default Employee;
