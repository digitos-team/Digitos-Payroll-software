import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";
const getCompanyId = () => {
  const state = store.getState();
  return state.auth?.companyId;
};
export const fetchTaxSlabs = async (companyId) => {
  try {
    const CompanyId = companyId || getCompanyId();

    const response = await axiosInstance.get("/gettaxslab", {
      params: { companyId: CompanyId }, // must match backend query param
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching tax slabs:", error);
    throw error;
  }
};



// Add a tax slab
export const addTaxSlab = async (slabData) => {
  try {
    const CompanyId = slabData?.CompanyId || getCompanyId();
    const payload = { ...slabData, CompanyId };
    const res = await axiosInstance.post("/addtaxslab", payload);
    return res.data;
  } catch (err) {
    console.error("Error adding tax slab:", err);
    throw err;
  }
};
