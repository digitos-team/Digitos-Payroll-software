import React, { useMemo, useState, useEffect } from "react";
import { useBranches } from "../context/BranchContext";
import SummaryCard from "../components/SummaryCard/SummaryCard";
import EmployeeDetailModal from "../components/Modals/EmployeeDetailModal";
import AddCompanyModal from "../components/Modals/AddCompanyModal";
import { downloadMonthlyPayrollReport } from "../../../utils/api/reportsapi";
export default function Branches() {
  const { branches, addBranch, totals, reloadAll, deleteBranch, payrollData } = useBranches();

  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollMonth, setPayrollMonth] = useState("");
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  // Reload all data once on mount
  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // Set selected branch when branches change
  useEffect(() => {
    if (branches?.length) {
      const selectedExists = selectedBranch && branches.some(
        (b) => (b.id || b._id) === (selectedBranch.id || selectedBranch._id)
      );
      if (!selectedExists) setSelectedBranch(branches[0]);
    } else {
      setSelectedBranch(null);
    }
  }, [branches]);

  // Add a new branch
  async function handleAdd(branchData) {
    try {
      const newBranch = await addBranch(branchData);
      if (newBranch) setSelectedBranch(newBranch);
      setOpenAddModal(false);
      showMessage("Branch added successfully");
    } catch (err) {
      console.error("Failed to add branch:", err);
      showMessage("Failed to add branch", true);
    }
  }

  // Delete a branch
  async function handleDeleteBranch(branch) {
    if (!window.confirm(`Delete branch "${branch.name || branch.BranchName}"?`)) return;
    try {
      const branchId = branch.id || branch._id;
      await deleteBranch(branchId);

      // Update selected branch if deleted
      if (selectedBranch && (selectedBranch.id === branchId || selectedBranch._id === branchId)) {
        const remaining = branches.filter((b) => (b.id || b._id) !== branchId);
        setSelectedBranch(remaining[0] || null);
      }

      showMessage(`Branch "${branch.name || branch.BranchName}" deleted`);
    } catch (err) {
      console.error("Failed to delete branch:", err);
      showMessage("Failed to delete branch", true);
    }
  }

  // Helper for showing messages
  function showMessage(msg, isError = false) {
    setInfoMessage(msg);
    setTimeout(() => setInfoMessage(""), 4000);
  }
  const handlePayrollDownload = async () => {
    if (!payrollMonth) {
      alert("Please select a month");
      return;
    }
    setLoadingPayroll(true);
    try {
      await downloadMonthlyPayrollReport(payrollMonth);
      alert("Payroll report downloaded successfully!");
    } catch (error) {
      alert("Failed to download report. Please try again.");
    } finally {
      setLoadingPayroll(false);
    }
  };
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Branches</h2>
        <p className="text-sm text-gray-500">Manage branches and view branch details</p>
      </header>

      {/* Summary Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard title="Total Branches" value={totals.totalBranches} Icon={() => null} color="bg-blue-500" />
        </div>
      </section>

      {/* Branch List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Branch List</h3>
          <button
            onClick={() => setOpenAddModal(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Branch
          </button>
        </div>

        {infoMessage && (
          <div
            className={`mb-4 p-3 rounded text-sm ${infoMessage.includes("Failed") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
          >
            {infoMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches?.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No branches available. Click "Add Branch" to create one.
            </div>
          ) : (
            branches.map((b) => {
              const bId = b.id || b._id;
              const selId = selectedBranch?.id || selectedBranch?._id;
              return (
                <div
                  key={bId}
                  className={`p-4 bg-white rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all ${selId === bId ? "ring-2 ring-blue-500" : ""
                    }`}
                  onClick={() => setSelectedBranch(b)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{b.name || b.BranchName || "Unnamed"}</div>
                      <div className="text-sm text-gray-500">{b.location || b.Location || "No location"}</div>
                    </div>
                    {/* <div className="text-right">
                      <div className="text-sm text-gray-500">₹ {(b.totalSalary || 0).toLocaleString()}</div>
                    </div> */}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBranch(b);
                      }}
                      className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Payroll Summary */}
      <section>
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Monthly Payroll Summary</h3>

          {(payrollData?.length || 0) === 0 ? (
            <div className="text-center py-8 text-gray-500">No payroll data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Month</th>
                    <th className="text-left py-3 px-4">Branch</th>
                    <th className="text-right py-3 px-4">Employees</th>
                    <th className="text-right py-3 px-4">Gross Salary</th>
                    <th className="text-right py-3 px-4">Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{item.Month}</td>
                      <td className="py-3 px-4">{item.Branch}</td>
                      <td className="text-right py-3 px-4">{item.employeeCount || 0}</td>
                      <td className="text-right py-3 px-4">₹ {(item.totalGross || 0).toLocaleString()}</td>
                      <td className="text-right py-3 px-4 font-semibold">₹ {(item.totalNet || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <AddCompanyModal open={openAddModal} onClose={() => setOpenAddModal(false)} onAdd={handleAdd} />
      <EmployeeDetailModal
        open={employeeModalOpen}
        onClose={() => {
          setEmployeeModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />

      <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Monthly Payroll Report</h4>
            <p className="text-sm text-gray-500 mt-1">
              Branch-wise payroll summary
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Month</label>
            <input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handlePayrollDownload}
            disabled={loadingPayroll}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loadingPayroll ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
