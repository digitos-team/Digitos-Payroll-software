// 

import { store } from "../../components/redux/MainStore";
import axiosInstance from "../axiosInstance";

const getCompanyId = () => {
  const state = store.getState();
  const companyId = state.auth?.companyId;
  return companyId?._id || companyId;
};

const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

// ---------------------
// 1️⃣ Get Total Payroll
// ---------------------
// ---------------------
// 1️⃣ Get Total Payroll
// ---------------------
export const getTotalPayroll = async (propCompanyId) => {
  try {
    // Use passed CompanyId or fallback to store (though passing is better)
    const CompanyId = propCompanyId || getCompanyId();

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // console.log("Fetching total payroll for:", { CompanyId, Month: currentMonth });

    const res = await axiosInstance.post("/gettotalsalarydistribution", {
      CompanyId,
      Month: currentMonth
    });

    // Handle nested data structure: res.data.data.totalGrossSalary
    // Fallback to res.data.totalGrossSalary if structure differs
    const data = res.data?.data || res.data;
    return data?.totalGrossSalary ?? 0;
  } catch (err) {
    if (err.response?.status === 404) {
      console.warn("Payroll endpoint returned 404 (No data or not found).");
    } else {
      console.error("Error fetching total payroll:", err);
    }
    return 0;
  }
};

// ---------------------
// 2️⃣ Get Payroll Records
// ---------------------
export const getPayrollRecords = async () => {
  try {
    const CompanyId = getCompanyId();

    const res = await axiosInstance.get("/payrollhistory", {
      params: { CompanyId }
    });

    return res.data?.data || [];
  } catch (err) {
    console.error("Error fetching payroll records:", err);
    return [];
  }
};
