import { store } from "../../components/redux/MainStore";
import axiosInstance from "../axiosInstance";


const getCompanyId = () => {
  const state = store.getState();
  const companyId = state.auth?.companyId;
  return companyId; // fallback handled if needed elsewhere
};
export const addDesignation = async (data) => {
  const CompanyId = getCompanyId();
  return axiosInstance.post("/add-designation", { ...data, CompanyId });
};

// 2. Get Designations by Company
export const getDesignationsByCompany = async () => {
  try {
    const CompanyId = getCompanyId();
    if (!CompanyId) return { data: { success: false, data: [] } };
    console.log("Fetching designations for CompanyId:", CompanyId);
    const res = await axiosInstance.post("/getdesignationbycompany", { CompanyId });
    console.log("Designations API response:", res.data);
    // Backend returns { success: true, data: [...] }
    return res;
  } catch (err) {
    console.error("Error fetching designations:", err);
    if (err.response?.status === 404) {
      console.warn("Designations endpoint not found (404)");
    }
    return { data: { success: false, data: [] } };
  }
};

// 3. Delete Designation
export const deleteDesignation = async (DesignationId) => {
  console.log("deleteDesignation function called with ID:", DesignationId);
  console.log("Full URL will be:", axiosInstance.defaults.baseURL + `/deletedesignation/${DesignationId}`);

  try {
    const response = await axiosInstance.delete(`/deletedesignation/${DesignationId}`);
    console.log("Delete response received:", response);
    return response;
  } catch (error) {
    console.error("Delete API error:", error);
    console.error("Error response:", error.response);
    console.error("Error request:", error.request);
    throw error;
  }
};


