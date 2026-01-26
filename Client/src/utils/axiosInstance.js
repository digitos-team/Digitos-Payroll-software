import axios from "axios";
import { store } from "../components/redux/MainStore";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const companyId = state.auth?.companyId;
    const role = state.auth?.role;
    const user = state.auth?.user;

    // Extract the actual company ID string from the companyId object
    const actualCompanyId = companyId?._id || companyId;
    const token = state.auth?.token;



    if (actualCompanyId) {
      config.headers["x-company-id"] = actualCompanyId;
    } else {
      delete config.headers["x-company-id"];
      console.warn("⚠️ No CompanyId found in Redux state");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("✅ Authorization header added");
    } else {
      console.error("❌ NO TOKEN - Request will likely fail authentication");
    }



    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for 401 handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {


    if (error.response && error.response.status === 401) {
      console.warn("🚨 Session expired or unauthorized. Logging out...");

      // Dispatch logout action directly to store
      store.dispatch({ type: "auth/logout" });

      // Optional: Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
