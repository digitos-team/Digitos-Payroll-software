
import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";

const getCompanyId = () => {
  const state = store.getState();
  const companyId = state.auth?.companyId;
  return companyId?._id || companyId;
};

// 1. Add Branch
export const addBranch = async (data) => {
  const CompanyId = getCompanyId();
  console.log("Adding branch for CompanyId:", CompanyId);

  return axiosInstance.post("/addbranch", {
    ...data,
    CompanyId,
  });
};

// 2. Get branches by company
export const getBranchesByCompany = async () => {
  const CompanyId = getCompanyId();
  if (!CompanyId) return { data: { data: [] } };

  return axiosInstance.post("/getbranchbycompany", {
    CompanyId,
  });
};

// 3. Delete branch
export const deleteBranch = async (branchId) => {
  const CompanyId = getCompanyId();

  return axiosInstance.delete("/deletebranch", {
    data: { BranchId: branchId, CompanyId },
  });
};

// 4. Total branch count
// 4. Total branch count
// 4. Total branch count
export const getTotalBranches = async () => {
  const CompanyId = getCompanyId();
  if (!CompanyId) return { success: false, totalBranches: 0 };

  try {
    // FIXED: Use GET /countbranches/:id matching HR implementation
    const res = await axiosInstance.get(`/countbranches/${CompanyId}`);

    // API returns { success: true, totalBranches: 5, ... } or { total: 5 }
    // HR BranchApi returns { data: res.data }
    // We need to return an object that DashboardHome expects: { data: { totalBranches: N } } or match DashboardHome logic

    // DashboardHome logic:
    // if (branchRes.status === "fulfilled" && branchRes.value?.success) {
    //   branchCount = branchRes.value?.totalBranches || branches.length;
    // }

    // Let's ensure we return what DashboardHome expects
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn("Total branches endpoint not found (404). Returning 0.");
      return { success: false, totalBranches: 0 };
    }
    console.error("Error fetching total branches:", err);
    return { success: false, totalBranches: 0 };
  }
};

// 5. Branch-wise monthly payroll
export const getBranchWiseMonthlyPayroll = async (month) => {
  const CompanyId = getCompanyId();
  if (!CompanyId) return { data: { data: [] } };

  return axiosInstance.get("/getbranchwisemonthlypayroll", {
    params: { CompanyId, Month: month },
  });
};
