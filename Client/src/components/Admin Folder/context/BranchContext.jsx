import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  getBranchesByCompany,
  addBranch as addBranchAPI,
  deleteBranch as deleteBranchAPI,
  getBranchWiseMonthlyPayroll,
} from "../../../utils/api/branchapi";
import { getDepartmentsByCompany, addDepartment as addDepartmentAPI, deleteDepartment as deleteDepartmentAPI } from "../../../utils/api/departmentapi";
import { getDesignationsByCompany } from "../../../utils/api/designationapi";
import { getAllEmployees, getEmployeeCountByDepartment } from "../../../utils/api/employeeapi";
import { getPayrollRecords } from "../../../utils/api/payrollapi";

const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employeeCountByDept, setEmployeeCountByDept] = useState([]);

  const { companyId } = useSelector((state) => state.auth);

  // --- Load Branches ---
  const loadBranches = useCallback(async () => {
    // Extract actual ID if companyId is an object
    const actualCompanyId = companyId?._id || companyId;

    if (!actualCompanyId) {
      setBranches([]);
      return;
    }

    try {
      const res = await getBranchesByCompany();
      const branchData = res.data?.data || res.data || [];
      setBranches(branchData);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranches([]);
    }
  }, [companyId]);

  // --- Load Employees ---
  const loadEmployees = useCallback(async () => {
    // Extract actual ID if companyId is an object
    const actualCompanyId = companyId?._id || companyId;

    if (!actualCompanyId) {
      setEmployees([]);
      return;
    }

    try {
      const res = await getAllEmployees(actualCompanyId);


      // Handle different response structures
      // HR EmployeeApi returns { data: users[] }
      // Other APIs might return { data: { data: [] } }
      let empData = res.data?.users || res.data?.data || res.data || [];

      // Ensure empData is an array
      if (!Array.isArray(empData)) {
        console.error("BranchContext: empData is not an array!", empData);
        if (empData && typeof empData === 'object' && empData.users) {
          empData = empData.users;
        } else if (empData && typeof empData === 'object' && empData.data) {
          empData = empData.data;
        } else {
          empData = [];
        }
      }

      if (!Array.isArray(empData)) {
        console.error("BranchContext: empData is STILL not an array, forcing []", empData);
        empData = [];
      }

      setEmployees(empData);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setEmployees([]);
    }
  }, [companyId]);

  // --- Load Employee Count By Department ---
  const loadEmployeeCountByDept = useCallback(async () => {
    const actualCompanyId = companyId?._id || companyId;
    if (!actualCompanyId) {
      setEmployeeCountByDept([]);
      return;
    }
    try {
      const res = await getEmployeeCountByDepartment();
      const filteredData = res.data.filter(d => d.DepartmentId !== null);

      const data = filteredData || [];
      setEmployeeCountByDept(data);
    } catch (err) {
      console.error("Failed to load employee count by department:", err);
      setEmployeeCountByDept([]);
    }
  }, [companyId]);

  // --- Load Departments ---
  const loadDepartments = useCallback(async () => {
    const actualCompanyId = companyId?._id || companyId;
    if (!actualCompanyId) {
      setDepartments([]);
      return;
    }

    try {
      const res = await getDepartmentsByCompany();
      const list = res.data?.data || res.data || [];
      const normalized = list.map(d => ({
        id: d.id || d.DepartmentId || d._id || d.ID,
        name: d.name || d.DepartmentName || d.departmentName || d.Name,
        roles: d.roles || d.Roles || d.roleList || [],
        responsibilities: d.responsibilities || d.Description || d.description || "",
        raw: d,
      }));
      setDepartments(normalized);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    }
  }, [companyId]);

  // --- Load Designations ---
  const loadDesignations = useCallback(async () => {
    const actualCompanyId = companyId?._id || companyId;
    if (!actualCompanyId) {
      setDesignations([]);
      return;
    }

    try {
      const res = await getDesignationsByCompany();
      const list = res.data?.data || res.data || [];
      const normalized = list.map(d => ({
        id: d.id || d.DesignationId || d._id || d.ID,
        name: d.name || d.DesignationName || d.name,
        raw: d,
      }));
      setDesignations(normalized);
    } catch (err) {
      console.error("Failed to load designations:", err);
      setDesignations([]);
    }
  }, [companyId]);

  // --- Load Payroll Data (Branch-wise) ---
  const loadPayrollData = useCallback(async (month) => {
    const actualCompanyId = companyId?._id || companyId;
    if (!actualCompanyId) {
      setPayrollData([]);
      return;
    }

    try {
      const res = await getBranchWiseMonthlyPayroll(month);
      const data = res.data?.data || res.data || [];
      setPayrollData(data);
    } catch (err) {
      console.error("Failed to load payroll data:", err);
      setPayrollData([]);
    }
  }, [companyId]);

  // --- Load Payroll Records (Individual Slips) ---
  const loadPayrollRecords = useCallback(async () => {
    if (!companyId) return;
    try {
      const records = await getPayrollRecords(companyId);
      setPayrollRecords(records);
    } catch (err) {
      console.error("Failed to load payroll records:", err);
      setPayrollRecords([]);
    }
  }, [companyId]);

  // --- Reload All ---
  const reloadAll = useCallback(async () => {
    const actualCompanyId = companyId?._id || companyId;
    if (!actualCompanyId) {
      setBranches([]);
      setDepartments([]);
      setDesignations([]);
      setEmployees([]);
      setPayrollData([]);
      setPayrollRecords([]);
      setEmployeeCountByDept([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    await Promise.all([
      loadBranches(),
      loadDepartments(),
      loadDesignations(),
      loadEmployees(),
      loadPayrollData(currentMonth),
      loadPayrollRecords(),
      loadEmployeeCountByDept(),
    ]);
    setLoading(false);
  }, [loadBranches, loadDepartments, loadDesignations, loadEmployees, loadPayrollData, loadPayrollRecords, loadEmployeeCountByDept, companyId]);

  // Run once on mount and when companyId changes
  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // --- Add Branch ---
  const addBranch = useCallback(async (branchData) => {
    try {
      const res = await addBranchAPI(branchData);
      const newBranch = res.data?.data || res.data;
      setBranches(prev => [...prev, newBranch]);
      return newBranch;
    } catch (err) {
      console.error("Failed to add branch:", err);
      throw err;
    }
  }, []);

  // --- Add Department ---
  const addDepartment = useCallback(async (departmentData) => {
    try {
      const res = await addDepartmentAPI(departmentData);
      const dept = res.data?.data || res.data;
      const normalized = {
        id: dept.id || dept.DepartmentId || dept._id || dept.ID,
        name: dept.name || dept.DepartmentName || dept.departmentName || dept.Name,
        roles: dept.roles || dept.Roles || dept.roleList || [],
        responsibilities: dept.responsibilities || dept.Description || dept.description || "",
        raw: dept,
      };
      setDepartments(prev => [...prev, normalized]);
      return normalized;
    } catch (err) {
      console.error("Failed to add department:", err);
      throw err;
    }
  }, []);

  // --- Delete Department ---
  const deleteDepartment = useCallback(async (departmentId) => {
    try {
      await deleteDepartmentAPI(departmentId);
      setDepartments(prev => prev.filter(d => (d.id || d._id) !== departmentId));
    } catch (err) {
      console.error("Failed to delete department:", err);
      throw err;
    }
  }, []);

  // --- Delete Branch ---
  const deleteBranch = useCallback(async (branchId) => {
    try {
      await deleteBranchAPI(branchId);
      setBranches(prev => prev.filter(b => (b.id || b._id) !== branchId));
    } catch (err) {
      console.error("Failed to delete branch:", err);
      throw err;
    }
  }, []);

  // --- Totals ---
  const totals = branches.reduce((acc, branch) => {
    acc.totalBranches += 1;
    acc.totalEmployees += branch.employees ? parseInt(branch.employees) || 0 : 0;
    acc.totalSalary += branch.totalSalary ? parseFloat(branch.totalSalary) || 0 : 0;
    return acc;
  }, { totalBranches: 0, totalEmployees: 0, totalSalary: 0 });

  return (
    <BranchContext.Provider
      value={{
        branches,
        departments,
        designations,
        employees,
        loading,
        payrollData,
        payrollRecords,
        employeeCountByDept,
        addBranch,
        addDepartment,
        deleteDepartment,
        deleteBranch,
        reloadAll,
        loadPayrollData,
        totals,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranches = () => useContext(BranchContext);
