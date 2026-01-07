import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";

const getCompanyId = () => {
  const state = store.getState();
  const companyId = state.auth?.companyId;
  return companyId?._id || companyId;
};

{/*-----------------------Get Total Revenue------------------------ */ }
// export const getTotalRevenue = async () => {
//   try {
//     const CompanyId = getCompanyId();
//     const res = await axiosInstance.post("/gettotalrevenue", {
//       CompanyId: CompanyId
//     });
//     return res.data?.totalRevenue ?? 0;
//   } catch (err) {
//     console.error("Error fetching total revenue:", err);
//     return 0;
//   }
// };

// ⭐ GET TOTAL REVENUE
export const getTotalRevenue = async (companyId) => {
  try {
    const CompanyId = companyId || getCompanyId();
    const actualCompanyId = CompanyId?._id || CompanyId;

    console.log("getTotalRevenue - CompanyId received:", companyId);
    console.log("getTotalRevenue - CompanyId from Redux:", CompanyId);
    console.log("getTotalRevenue - Actual CompanyId to send:", actualCompanyId);

    if (!actualCompanyId) {
      throw new Error("Company ID is required");
    }

    // Backend route: POST /gettotalrevenue/:CompanyId
    // NOTE: Backend has a bug - uses lowercase 'companyId' in $match instead of 'CompanyId'
    // You need to fix backend: change $match: { companyId: companyId } to $match: { CompanyId: new mongoose.Types.ObjectId(CompanyId) }
    const response = await axiosInstance.post(`/gettotalrevenue/${actualCompanyId}`);

    console.log("getTotalRevenue - Response:", response.data);

    return response.data;   // { companyId, totalRevenue, totalRecords }
  } catch (error) {
    console.error("❌ Error fetching total revenue:", error);
    console.error("Error response:", error.response?.data);

    // 🔍 Detailed error logging for authentication issues
    if (error.response?.status === 401) {
      console.error("🚨 AUTHENTICATION FAILED - Token is invalid or expired");
      console.error("💡 Solution: Check if you're logged in and token is valid");
    } else if (error.response?.status === 403) {
      console.error("🚨 AUTHORIZATION FAILED - User doesn't have required role");
      console.error("💡 Solution: Ensure user role is 'Admin' or 'CA'");
    } else if (error.response?.status === 404) {
      const errorMsg = error.response?.data?.message || "";
      if (errorMsg.includes("User not found")) {
        console.error("🚨 USER NOT FOUND - Token contains invalid user ID");
        console.error("💡 Solution: Log out and log back in to get a fresh token");
        console.error("💡 Backend Issue: Check if user ID in JWT token exists in database");
      } else {
        console.error("🚨 ENDPOINT NOT FOUND - Backend route may not exist");
      }
    }

    return { totalRevenue: 0, totalRecords: 0 };
  }
};


{/*-----------------------Add Revenue------------------------ */ }
export const addRevenue = async (revenueData) => {
  try {
    const CompanyId = getCompanyId(); // get companyId from Redux
    if (!CompanyId) throw new Error("CompanyId not found in Redux state");

    const payload = {
      ...revenueData,
      CompanyId, // inject companyId
    };

    const response = await axiosInstance.post("/addrevenue", payload);
    return response.data;
  } catch (error) {
    console.error("Error adding revenue:", error);
    throw error;
  }
};

export const getAllRevenue = async (propCompanyId) => {
  try {
    const CompanyId = propCompanyId || getCompanyId();
    const actualCompanyId = CompanyId?._id || CompanyId;
    const params = { CompanyId: actualCompanyId };
    console.log("Fetching revenue for CompanyId:", actualCompanyId);

    // Use /getrevenue endpoint (matches backend route)
    const res = await axiosInstance.get("/getrevenue", { params });
    console.log("Revenue API response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Error fetching revenue:", err);
    if (err.response?.status === 404) {
      console.warn("Revenue endpoint not found (404)");
    }
    return []; // Return empty array to prevent UI errors
  }
};
{/*-----------------------Delete Revenue------------------------ */ }
export const deleteRevenue = async (id) => {
  try {
    const CompanyId = getCompanyId();

    const response = await axiosInstance.delete(`/deleterevenue`, {
      data: { id, CompanyId }   // send body here!
    });

    return response.data;

  } catch (error) {
    console.error("Error deleting revenue:", error);
    throw error;
  }
};


{/*--------------------Revenue Vs Expense Trend----------------------- */ }
export const getRevenueVsExpenseTrend = async () => {
  try {
    const CompanyId = getCompanyId();
    const res = await axiosInstance.get("/revenue-vs-expense", {
      params: { CompanyId }
    });
    console.log("CompanyId sent:", CompanyId);
    return res.data?.trend || [];
  } catch (err) {
    console.error("Error fetching revenue vs expense trend:", err);
    return [];
  }
};

{/*--------------------Order Vs Expense Trend----------------------- */ }
export const getOrderVsExpenseTrend = async () => {
  try {
    const CompanyId = getCompanyId();
    const res = await axiosInstance.get("/order-expense", {
      params: { CompanyId }
    });
    // console.log("CompanyId sent:", CompanyId);


    return res.data?.trend || [];
  } catch (err) {
    console.error("Error fetching order vs expense trend:", err);
    return [];
  }
};
{/*--------------------Profit Vs Expense Trend ------------------------- */ }
export const getProfitVsExpenseTrend = async () => {
  try {
    const CompanyId = getCompanyId();
    const res = await axiosInstance.get("/profit-expense", {
      params: { CompanyId }
    });

    return res.data?.trend || [];
  } catch (err) {
    console.error("Error fetching order vs expense trend:", err);
    return [];
  }
};

{/*--------------------Profit Vs Payroll Trend ------------------------- */ }
export const getProfitVsPayrollTrend = async () => {
  try {
    const CompanyId = getCompanyId();
    const res = await axiosInstance.get("/profit-payroll", {
      params: { CompanyId }
    });

    return res.data?.trend || [];
  } catch (err) {
    console.error("Error fetching order vs expense trend:", err);
    return [];
  }
};

{/*--------------------------Get Month Revenue------------------------------ */ }

export const getMonthRevenue = async (month, year) => {
  try {
    const CompanyId = getCompanyId(); // If you store it in Redux/localStorage

    const response = await axiosInstance.get("/monthlywisedetails", {
      params: {
        month,
        year,
        CompanyId,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching month revenue:", error);
    throw error;
  }
};

{/*---------------------------Get Revenue by Order Id---------------------- */ }
export const getRevenueByOrderName = async (orderName) => {
  try {
    console.log("🔍 Searching revenue by order name:", orderName);

    const response = await axiosInstance.get(
      `/getrevenuebyordername?name=${encodeURIComponent(orderName)}`
    );

    console.log("✅ Revenue search response:", response.data);
    return response.data; // backend will return { revenues: [...] }
  } catch (error) {
    console.error("❌ Error fetching revenue by order name:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);

    if (error.response?.status === 404) {
      console.error("🚨 Endpoint not found - Check if backend route exists");
    }

    throw error;
  }
};

{/*--------------------------Get Revenue With Profit By Order---------------------  */ }
export const getRevenueWithProfitByOrder = async (orderId) => {
  try {
    const response = await axiosInstance.post("/getrevenuewithprofit", {
      orderId,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching revenue & profit by orderId:", error);
    throw error;
  }
};
{/*--------------------------Get Total Profit------------------------- */ }
export const getTotalProfit = async (orderId) => {
  try {
    const response = await axiosInstance.post("/gettotalprofitnet", {
      orderId,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching revenue & profit by orderId:", error);
    throw error;
  }
};