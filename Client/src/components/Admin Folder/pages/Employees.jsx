import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FiEdit, FiEye, FiSearch, FiBriefcase, FiUser, FiTrash2 } from "react-icons/fi";
import { getAllEmployees, updateEmployee, deleteEmployee } from "../../../utils/api/employeeapi";
import EditUserModal from "../components/Modals/EditUserModal";
import EmployeeDetailModal from "../components/Modals/EmployeeDetailModal";
import { getAssetUrl } from "../../../utils/config";

const Employees = () => {
  const { companyId } = useSelector((state) => state.auth);
  // Extract proper ID string
  const actualCompanyId = companyId?._id || companyId;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [actualCompanyId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (!actualCompanyId) return;
      // Fetch all employees (no role filter passed to get all)
      const res = await getAllEmployees(null, actualCompanyId);
      // Expected response format from getAllEmployees is { data: [...] } or { users: [...] }
      // Our API function normalizes it to { data: [...] } if possible, but let's be safe
      const data = res.data?.users || res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Invalid employees data format:", data);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (id, formData) => {
    try {
      await updateEmployee(id, formData);
      // Refresh list
      fetchEmployees();
      alert("Employee updated successfully");
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update employee");
    }
  };

  const handleDeleteEmployee = async (emp) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${emp.Name}?\n\nThis action cannot be undone and will remove all associated data.`
    );

    if (!confirmed) return;

    try {
      await deleteEmployee(emp._id || emp.id);
      // Refresh list
      fetchEmployees();
      alert(`${emp.Name} has been deleted successfully`);
    } catch (error) {
      console.error("Delete failed", error);
      const errorMsg = error.message || "Failed to delete employee";
      alert(errorMsg);
    }
  };

  const getProfilePhotoUrl = (path) => {
    return getAssetUrl(path);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesName = emp.Name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesRole = roleFilter ? emp.role === roleFilter : true;
    return matchesName && matchesRole;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Employee Directory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage all employees, HRs, and CAs</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="HR">HR</option>
            <option value="CA">CA</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role & Dept</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id || emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 shrink-0">
                          {emp.ProfilePhoto ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              src={getProfilePhotoUrl(emp.ProfilePhoto)}
                              alt=""
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm" style={{ display: emp.ProfilePhoto ? 'none' : 'flex' }}>
                            {emp.Name?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{emp.Name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{emp.EmployeeCode || "No ID"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${emp.role === 'Admin' ? 'bg-red-100 text-red-800' :
                          emp.role === 'HR' ? 'bg-purple-100 text-purple-800' :
                            emp.role === 'CA' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          {emp.role}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FiBriefcase className="w-3 h-3" />
                          {typeof emp.DepartmentId === 'object' ? emp.DepartmentId?.DepartmentName : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">{emp.Email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{emp.Phone || "No Phone"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedEmp(emp); setIsViewModalOpen(true); }}
                          className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 p-2 rounded-lg transition"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedEmp(emp); setIsEditModalOpen(true); }}
                          className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-600 p-2 rounded-lg transition"
                          title="Edit Employee"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-gray-600 p-2 rounded-lg transition"
                          title="Delete Employee"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateUser}
        employee={selectedEmp}
      />

      {/* View Modal */}
      <EmployeeDetailModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        employee={selectedEmp}
      />

    </div>
  );
};

export default Employees;
