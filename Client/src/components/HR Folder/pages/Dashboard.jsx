import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getEmployeeCount } from "../utils/api/EmployeeApi";
import { getDepartmentCount } from "../utils/api/DepartmentApi";
import { getBranchCount } from "../utils/api/BranchApi";
import { fetchSalaryDistribution } from "../../../utils/CA api/CaApi";
import { getAllLeaves } from "../../../utils/api/leaveApi"; // Import Leave API
import PayrollTrendChart from "../components/PayrollTrendChart";
import { Bell, AlertCircle } from "lucide-react"; // Import Icons
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [employeeCount, setEmployeeCount] = useState("-");
  const [payrollData, setPayrollData] = useState(null);
  const [departmentCount, setDepartmentCount] = useState("-");
  const [branchCount, setBranchCount] = useState("-");
  const [pendingLeaves, setPendingLeaves] = useState(0); // State for pending leaves
  const { companyId } = useSelector((state) => state.auth);

  // Extract the actual company ID string from the companyId object
  const actualCompanyId = companyId?._id || companyId;

  useEffect(() => {
    const fetchData = async () => {
      if (!actualCompanyId) return;

      // Fetch Employee Count
      try {
        const empRes = await getEmployeeCount(actualCompanyId);
        if (empRes.data && empRes.data.success) {
          setEmployeeCount(empRes.data.total);
        }
      } catch (err) {
        console.error("Error fetching employee count:", err);
      }

      // Fetch Payroll Data (Current Month)
      try {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const currentMonth = `${year}-${month}`;

        const payrollRes = await fetchSalaryDistribution(currentMonth);
        if (payrollRes && payrollRes.totalGrossSalary !== undefined) {
          setPayrollData(payrollRes);
        }
      } catch (err) {
        console.error("Error fetching salary distribution:", err);
      }

      // Fetch Department Count
      try {
        const deptRes = await getDepartmentCount(actualCompanyId);
        if (deptRes.data && deptRes.data.success) {
          setDepartmentCount(deptRes.data.count);
        }
      } catch (err) {
        console.error("Error fetching department count:", err);
      }

      // Fetch Branch Count
      try {
        const branchRes = await getBranchCount(actualCompanyId);
        if (branchRes.data && branchRes.data.success) {
          setBranchCount(branchRes.data.totalBranches);
        }
      } catch (err) {
        console.error("Error fetching branch count:", err);
      }

      // Fetch Pending Leaves
      try {
        const leavesRes = await getAllLeaves(actualCompanyId);
        if (leavesRes.success && Array.isArray(leavesRes.data)) {
          const pending = leavesRes.data.filter(leave => leave.Status === "Pending").length;
          setPendingLeaves(pending);
        }
      } catch (err) {
        console.error("Error fetching leaves:", err);
      }
    };

    fetchData();
  }, [actualCompanyId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
      <p className="text-gray-500 mb-6">Welcome back, here's what's happening today.</p>

      {/* NOTIFICATION SECTION */}
      {pendingLeaves > 0 && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Pending Leave Requests</h3>
              <p className="text-amber-700 text-sm">
                You have <span className="font-bold">{pendingLeaves}</span> leave requests waiting for approval.
              </p>
            </div>
          </div>
          <Link
            to="/hr/leaves"
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            Review Requests
          </Link>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Employees */}
        <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100">
          <h4 className="text-gray-500 text-sm font-medium">Total Employees</h4>
          <p className="text-3xl font-bold mt-2 text-gray-800">{employeeCount}</p>
        </div>

        {/* Payroll */}
        <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100">
          <h4 className="text-gray-500 text-sm font-medium">Payroll (This Month)</h4>
          <p className="text-3xl font-bold mt-2 text-gray-800">
            {payrollData ? `₹${(payrollData.totalGrossSalary || 0).toLocaleString()}` : "-"}
          </p>
        </div>

        {/* Departments */}
        <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100">
          <h4 className="text-gray-500 text-sm font-medium">Departments</h4>
          <p className="text-3xl font-bold mt-2 text-gray-800">{departmentCount}</p>
        </div>

        {/* Branches */}
        <div className="bg-white shadow-md rounded-xl p-5 border border-gray-100">
          <h4 className="text-gray-500 text-sm font-medium">Branches</h4>
          <p className="text-3xl font-bold mt-2 text-gray-800">{branchCount}</p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="mt-6">
        <PayrollTrendChart />
      </div>
    </div>
  );
};

export default Dashboard;