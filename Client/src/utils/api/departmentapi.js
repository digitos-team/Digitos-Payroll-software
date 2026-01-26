import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";

const getCompanyId = () => {
  const state = store.getState();
  const companyId = state.auth?.companyId;
  return companyId;
};

// -------------------- Departments --------------------

// 1. Add Department
export const addDepartment = async (data) => {
  const CompanyId = getCompanyId();
  return axiosInstance.post("/adddepartment", { ...data, CompanyId });
};

// 2. Get Departments by Company
export const getDepartmentsByCompany = async () => {
  try {
    const CompanyId = getCompanyId();
    if (!CompanyId) return { data: { success: false, data: [] } };
    console.log("Fetching departments for CompanyId:", CompanyId);
    const res = await axiosInstance.post("/getdepartment", { CompanyId });
    console.log("Departments API response:", res.data);
    // Backend returns { success: true, data: [...] }
    return res;
  } catch (err) {
    console.error("Error fetching departments:", err);
    if (err.response?.status === 404) {
      console.warn("Departments endpoint not found (404)");
    }
    return { data: { success: false, data: [] } };
  }
};

// 3. Delete Department
export const deleteDepartment = async (DepartmentId) => {
  return axiosInstance.delete(`/deletedepartment/${DepartmentId}`);
};

// 4. Count Departments
export const countDepartmentsByCompany = async () => {
  const CompanyId = getCompanyId();
  if (!CompanyId) return { data: 0 };
  return axiosInstance.get("/countdepartment", { params: { CompanyId } });
};

// -------------------- Designations --------------------

// 1. Add Designation
export const addDesignation = async (data) => {
  const CompanyId = getCompanyId();
  return axiosInstance.post("/add-designation", { ...data, CompanyId });
};

// 2. Get Designations by Company
export const getDesignationsByCompany = async () => {
  const CompanyId = getCompanyId();
  if (!CompanyId) return { data: { data: [] } };
  return axiosInstance.post("/getdesignationbycompany", { CompanyId });
};

// 3. Delete Designation
export const deleteDesignation = async (DesignationId) => {
  const CompanyId = getCompanyId();
  return axiosInstance.delete("/deletedesignation", {
    data: { DesignationId, CompanyId },
  });
};
