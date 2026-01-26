/* ------------------------------------------------------------------
   DASHBOARD SUMMARY (COMBINED API)
------------------------------------------------------------------ */

import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";

const getCompanyId = () => {
  const state = store.getState();
  const companyId = state.auth?.companyId;
  return companyId?._id || companyId;
};

export const fetchDashboardSummary = async () => {
  try {
    const [revenue, expenses, profit] = await Promise.all([
      getTotalRevenue(),
      getTotalExpensesByCompany(),
      getTotalProfitNet(),

    ]);

    return {
      totalRevenue: revenue?.totalRevenue ?? 0,
      totalExpenses: expenses?.totalExpense ?? 0,
      totalProfit: profit?.totalProfit ?? 0,
      totalTaxDeductions: profit?.totalTaxDeductions ?? 0, // only if backend returns
    };
  } catch (err) {
    console.error("Dashboard summary error:", err);
    throw new Error("Failed to load dashboard summary");
  }
};



export const getTotalExpensesByCompany = async (data = {}) => {
  const res = await axiosInstance.post("/gettotalexpensesbycompany", {
    ...data,
    CompanyId: getCompanyId(),
  });
  return res.data;
};

export const getTotalRevenue = async (data = {}) => {
  try {
    const CompanyId = getCompanyId();

    if (!CompanyId) {
      throw new Error("Company ID is required");
    }

    // Backend route: POST /gettotalrevenue/:CompanyId
    const res = await axiosInstance.post(`/gettotalrevenue/${CompanyId}`, data);
    return res.data;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    console.error("Error response:", error.response?.data);

    // Return default values instead of throwing to prevent dashboard crash
    return { totalRevenue: 0, totalRecords: 0 };
  }
};

export const getTotalProfitNet = async () => {
  const res = await axiosInstance.get("/gettotalprofitnet", {
    params: { CompanyId: getCompanyId() }
  });

  return res.data;
};


/* ------------------------------------------------------------------
   SALARY
------------------------------------------------------------------ */

export const calculateSalaryForAll = async (data = {}) => {
  const res = await axiosInstance.post(
    "/calculatesalaryforall",
    {
      ...data,
      CompanyId: getCompanyId(),
    }
  );
  return res.data;
};

/* ------------------------------------------------------------------
   CHART: PROFIT VS EXPENSES
------------------------------------------------------------------ */
export const getProfitVsExpenses = async () => {
  const res = await axiosInstance.get("/profit-expense", {
    params: { CompanyId: getCompanyId() },
  });
  return res.data.trend;
};
/* ------------------------------------------------------------------
   CHART: PROFIT VS PAYROLL
------------------------------------------------------------------ */

export const fetchProfitPayrollTrend = async () => {
  const res = await axiosInstance.get("/profit-payroll", {
    params: { CompanyId: getCompanyId() },
  });
  return res.data.trend;
};


export const fetchOrderAmountVsExpensesTrend = async () => {
  const res = await axiosInstance.get("/order-expense", {
    params: { CompanyId: getCompanyId() },
  });
  return res.data.trend;
};

export const fetchTaxSlabs = async (companyId) => {
  try {
    const params = companyId ? { companyId } : {};
    const response = await axiosInstance.get("/gettaxslab", { params });
    return response.data;  // This will be the slabs array from backend
  } catch (error) {
    console.error("Error fetching tax slabs:", error);
    throw error;
  }
};
export const fetchPayrollHistory = async (params) => {
  try {
    const res = await axiosInstance.get("/payrollhistory", {
      params: params,
    });

    // Return only the payroll data array inside response object
    return res.data;
  } catch (error) {
    console.error("Error fetching payroll history:", error);
    throw error;
  }
};
export const fetchPayrollReport = async (options = {}) => {
  try {
    const res = await axiosInstance.get("/payrolltrend", {
      params: { CompanyId: getCompanyId() },
    });
    const trend = res.data?.trend ?? [];
    // Map backend keys to frontend keys expected by chart
    return trend.map(({ Month, totalGrossSalary, totalTax }) => ({
      month: Month,
      payrollCost: totalGrossSalary || 0,
      tax: totalTax || 0,
    }));
  } catch (error) {
    console.error("Error fetching payroll report:", error);
    return []; // Return empty array instead of throwing to prevent UI crash
  }
};
export const fetchSalaryDistribution = async (month) => {
  if (!month) throw new Error("Month is required");
  try {
    const res = await axiosInstance.post("/gettotalsalarydistribution", {
      CompanyId: getCompanyId(),
      Month: month,
    });

    // Backend returns: { success: true, data: { totalTaxes, totalGrossSalary, totalDeductions } }
    // Extract the nested data object
    return res.data.data || res.data; // Contains totalTaxes, totalGrossSalary, totalDeductions
  } catch (error) {
    console.error("Error fetching salary distribution:", error);
    throw error;
  }
};


// expense list
export const getAllExpenses = async () => {
  try {
    const res = await axiosInstance.get("/getallexpense", {
      params: {
        CompanyId: getCompanyId(),

      },
    });

    return res.data;
  } catch (err) {
    console.error("Error fetching expenses:", err);
    throw err.response?.data || err;
  }
};

/* ------------------------------------------------------------------
   ORDERS API
------------------------------------------------------------------ */

export const getOrders = async () => {
  try {
    const res = await axiosInstance.get("/getorders", {
      params: {
        CompanyId: getCompanyId(),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching orders:", err);
    throw err.response?.data || err;
  }
};

export const getOrderById = async (id) => {
  try {
    const res = await axiosInstance.get(`/getorder/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    throw err.response?.data || err;
  }
};

export const getMonthlyOrders = async (year) => {
  try {
    const res = await axiosInstance.get("/monthwiseorders", {
      params: {
        CompanyId: getCompanyId(),
        year: year || new Date().getFullYear(),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching monthly orders:", err);
    throw err.response?.data || err;
  }
};

export const getMonthOrders = async (month, year) => {
  try {
    const res = await axiosInstance.get("/monthlydetails", {
      params: {
        CompanyId: getCompanyId(),
        month,
        year,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching month orders:", err);
    throw err.response?.data || err;
  }
};

export const exportOrderInvoice = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/orderinvoice/${orderId}`, {
      responseType: 'blob',
    });
    return res.data;
  } catch (err) {
    console.error("Error exporting order invoice:", err);
    throw err.response?.data || err;
  }
};

export const exportFinalBill = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/finalbill/${orderId}`, {
      responseType: 'blob',
    });
    return res.data;
  } catch (err) {
    console.error("Error exporting final bill:", err);
    throw err.response?.data || err;
  }
};


/* ------------------------------------------------------------------
   REVENUE API
------------------------------------------------------------------ */

export const getAllRevenue = async () => {
  try {
    const res = await axiosInstance.get("/getrevenue", {
      params: {
        CompanyId: getCompanyId(),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching all revenue:", err);
    throw err.response?.data || err;
  }
};

export const getRevenueById = async (id) => {
  try {
    const res = await axiosInstance.get(`/getrevenuebyid/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching revenue by ID:", err);
    throw err.response?.data || err;
  }
};

export const getRevenueByOrderId = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/getrevenuebyorder/${orderId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching revenue by order ID:", err);
    throw err.response?.data || err;
  }
};

export const getMonthlyRevenue = async (year) => {
  try {
    const res = await axiosInstance.get("/getmonthlyrevenue", {
      params: {
        CompanyId: getCompanyId(),
        year: year || new Date().getFullYear(),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching monthly revenue:", err);
    throw err.response?.data || err;
  }
};

export const getMonthRevenue = async (month, year) => {
  try {
    const res = await axiosInstance.get("/monthlywisedetails", {
      params: {
        CompanyId: getCompanyId(),
        month,
        year,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching month revenue:", err);
    throw err.response?.data || err;
  }
};
/* ------------------------------------------------------------------
   PURCHASES API
------------------------------------------------------------------ */

export const getPurchases = async () => {
  try {
    const res = await axiosInstance.get("/getpurchases", {
      params: { CompanyId: getCompanyId() }
    });
    return res.data?.data || [];  // <-- Make sure it's an array
  } catch (err) {
    console.error("Error fetching purchases:", err);
    throw err.response?.data || err;
  }
};


export const getPurchaseByOrderId = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/getpurchaseswithordersexpense${orderId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching purchase by order ID:", err);
    throw err.response?.data || err;
  }
};

export const getMonthlyPurchases = async (year) => {
  try {
    const res = await axiosInstance.get("/getmonthlypurchases", {
      params: {
        CompanyId: getCompanyId(),
        year: year || new Date().getFullYear(),
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching monthly purchases:", err);
    throw err.response?.data || err;
  }
};

export const getMonthPurchases = async (month, year) => {
  try {
    const res = await axiosInstance.get("/getmonthpurchases", {
      params: {
        CompanyId: getCompanyId(),
        month,
        year,
      },
    });
    return res.data.data || [];
  } catch (err) {
    console.error("Error fetching month purchases:", err);
    throw err.response?.data || err;
  }
};
