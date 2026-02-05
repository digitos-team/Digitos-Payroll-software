import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Admin Imports
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardHome from "../pages/DashboardHome";
import Branches from "../pages/Branches";
import Payroll from "../pages/Payroll";
import Departments from "../pages/Departments";
import Reports from "../pages/Reports";
import Finance from "../pages/Finance";
import Settings from "../pages/Settings";
import Employees from "../pages/Employees";
import BranchList from "../pages/BranchList";
import Designation from "../pages/Designation";
import Revenue from "../pages/Revenue";
import Orders from "../pages/Orders";
import ManageSales from "../pages/ManageSales";
import Expenses from "../pages/Expenses";
import Holidays from "../pages/Holidays";
import LeaveSettings from "../pages/LeaveSettings";
import AdminSalaryRequests from "../pages/SalaryRequests";
import AdminSalarySettings from "../pages/AdminSalarySettings";

// CA Imports
import CADashboard from "../../CA folder/pages/CADashboard";
import CAOrders from "../../CA folder/pages/Orders";
import CAPurchases from "../../CA folder/pages/Purchases";
import CARevenue from "../../CA folder/pages/Revenue";
import CAExpenses from "../../CA folder/pages/Expenses";
import CATaxSlab from "../../CA folder/pages/TaxSlab";
import CAViewPayrollData from "../../CA folder/pages/ViewPayrollData";
import CAReports from "../../CA folder/pages/Reports";

// HR Imports
import HRLayout from "../../HR Folder/layouts/HRLayout";
import HRDashboard from "../../HR Folder/pages/Dashboard";
import HREmployees from "../../HR Folder/pages/Employee";
import HREmployeeDetails from "../../HR Folder/pages/EmployeeDetails";
import HRDepartments from "../../HR Folder/pages/Departments";
import HRDesignations from "../../HR Folder/pages/Designation";
import HRBranches from "../../HR Folder/pages/Branches";
import HRPayroll from "../../HR Folder/pages/Payroll";
import HRPayrollHistory from "../../HR Folder/pages/PayrollHistory";
import HRSalarySetting from "../../HR Folder/pages/SalarySettings";
import HRSettings from "../../HR Folder/pages/HRSettings";
import SalaryRequests from "../../HR Folder/pages/SalaryRequests";
import HRAttendance from "../../HR Folder/pages/Attendance";
import HRLeaveRequests from "../../HR Folder/pages/LeaveRequests";

// Employee Imports
import EmployeeDashboard from "../../employee/EmployeeDashboard";
import Profile from "../../employee/Profile";
import Salary from "../../employee/Salary";
import EmployeeLeaves from "../../employee/Leaves";
import EmployeeAttendance from "../../employee/EmployeeAttendance";

// Login
import Login from "../pages/LoginPage";

const AdminRoutes = () => (
  <Route element={<DashboardLayout />}>
    <Route index element={<DashboardHome />} />
    <Route path="finance" element={<Finance />} />
    <Route path="branches" element={<Branches />} />
    <Route path="departments" element={<Departments />} />
    <Route path="holidays" element={<Holidays />} />
    <Route path="leave-settings" element={<LeaveSettings />} />
    <Route path="payroll" element={<Payroll />} />
    <Route path="reports" element={<Reports />} />
    <Route path="settings" element={<Settings />} />
    <Route path="employees" element={<Employees />} />
    <Route path="branch-list" element={<BranchList />} />
    <Route path="designation" element={<Designation />} />
    <Route path="revenue" element={<Revenue />} />
    <Route path="orders" element={<Orders />} />
    <Route path="manage-sales" element={<ManageSales />} />
    <Route path="expenses" element={<Expenses />} />
    <Route path="expenses" element={<Expenses />} />
    <Route path="salary-requests" element={<AdminSalaryRequests />} />
    <Route path="salary-settings" element={<AdminSalarySettings />} />
  </Route>
);

const CARoutes = () => [
  <Route key="ca-dashboard" path="/ca" element={<CADashboard />} />,
  <Route key="ca-orders" path="/ca/orders" element={<CAOrders />} />,
  <Route key="ca-purchases" path="/ca/purchases" element={<CAPurchases />} />,
  <Route key="ca-revenue" path="/ca/revenue" element={<CARevenue />} />,
  <Route key="ca-expenses" path="/ca/expenses" element={<CAExpenses />} />,
  <Route key="ca-tax-slab" path="/ca/tax-slab" element={<CATaxSlab />} />,
  <Route
    key="ca-view-payroll"
    path="/ca/view-payroll"
    element={<CAViewPayrollData />}
  />,
  <Route
    key="ca-view-reports"
    path="/ca/view-reports"
    element={<CAReports />}
  />,
  <Route key="ca-salary-settings" path="/ca/salary-settings" element={<AdminSalarySettings />} />,
  <Route key="ca-redirect" path="*" element={<Navigate to="/ca" replace />} />,
];

const HRRoutes = () => (
  <Route element={<HRLayout />}>
    <Route index path="/hr" element={<HRDashboard />} />
    <Route path="/hr/employees" element={<HREmployees />} />
    <Route path="/hr/employees/:id" element={<HREmployeeDetails />} />
    <Route path="/hr/attendance" element={<HRAttendance />} />
    <Route path="/hr/leave-requests" element={<HRLeaveRequests />} />
    <Route path="/hr/departments" element={<HRDepartments />} />
    <Route path="/hr/designations" element={<HRDesignations />} />
    <Route path="/hr/branches" element={<HRBranches />} />
    <Route path="/hr/payroll" element={<HRPayroll />} />
    <Route path="/hr/payrollhistory" element={<HRPayrollHistory />} />
    <Route path="/hr/salary-setting" element={<HRSalarySetting />} />
    <Route path="/hr/salary-requests" element={<SalaryRequests />} />
    <Route path="/hr/settings" element={<HRSettings />} />
    <Route path="*" element={<Navigate to="/hr" replace />} />
  </Route>
);

const EmployeeRoutes = () => (
  <Route element={<EmployeeDashboard />}>
    <Route index path="/employee" element={<Navigate to="profile" replace />} />
    <Route path="/employee/profile" element={<Profile />} />
    <Route path="/employee/attendance" element={<EmployeeAttendance />} />
    <Route path="/employee/leaves" element={<EmployeeLeaves />} />
    <Route path="/employee/salary" element={<Salary />} />
    <Route path="*" element={<Navigate to="/employee/profile" replace />} />
  </Route>
);

export default function AppRoutes() {
  const { token, role } = useSelector((state) => state.auth);



  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {token ? (
        role?.toLowerCase() === "admin" ? (
          AdminRoutes()
        ) : role?.toLowerCase() === "ca" ? (
          CARoutes()
        ) : role?.toLowerCase() === "hr" ? (
          HRRoutes()
        ) : role?.toLowerCase() === "employee" ? (
          EmployeeRoutes()
        ) : (
          <Route
            path="*"
            element={<div className="p-10">Unauthorized Role: {role}</div>}
          />
        )
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
