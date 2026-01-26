import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";

const getCompanyId = () => {
  const state = store.getState();
  return state.auth?.companyId;
};

// ==================== ADD ORDER ====================
export const addOrderApi = async (orderData) => {
  try {
    const data = {
      ...orderData,
      CompanyId: getCompanyId(),
    };
    const res = await axiosInstance.post("/addorders", data);
    return res.data;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error.response?.data || error;
  }
};

// ==================== GET ORDERS ====================
export const getOrdersApi = async (filters = {}) => {
  try {
    const params = {
      CompanyId: getCompanyId(),
      ...filters,
    };
    const res = await axiosInstance.get("/getorders", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error.response?.data || error;
  }
};

// ==================== GET ORDER BY ID ====================
export const getOrderByIdApi = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/getorder/${orderId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error.response?.data || error;
  }
};

// ==================== CONFIRM ORDER (WITH PAYMENT) ====================
export const confirmOrderApi = async (orderId, paymentData) => {
  try {
    const res = await axiosInstance.put("/confirm-order", {
      id: orderId,
      amountReceived: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      notes: paymentData.notes,
    });
    return res.data;
  } catch (error) {
    console.error("Error confirming order:", error);
    throw error.response?.data || error;
  }
};


// ==================== RECORD PAYMENT ====================
export const recordPaymentApi = async (orderId, paymentData) => {
  try {
    const res = await axiosInstance.post("/recordpayment", {
      id: orderId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      notes: paymentData.notes,
    });
    return res.data;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error.response?.data || error;
  }
};


export const updateOrderApi = async (data) => {
  const { id, ...updates } = data;  // extract id
  try {
    const res = await axiosInstance.put("/update-order", { id, ...updates });
    return res.data;
  } catch (err) {
    console.error("Error updating order:", err);
    throw err.response?.data || err;
  }
};

// ==================== DELETE ORDER ====================
export const deleteOrderApi = async (orderId) => {
  try {
    const res = await axiosInstance.delete("/deleteorder", {
      data: { id: orderId },
    });
    return res.data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error.response?.data || error;
  }
};

// ==================== GET MONTHLY ORDERS ====================
export const getMonthlyOrdersApi = async (year) => {
  try {
    const res = await axiosInstance.get("/monthwiseorders", {
      params: { CompanyId: getCompanyId(), year },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching monthly orders:", error);
    throw error.response?.data || error;
  }
};

// ==================== GET MONTH ORDERS ====================
export const getMonthOrdersApi = async (month, year) => {
  try {
    const res = await axiosInstance.get("/monthlydetails", {
      params: { CompanyId: getCompanyId(), month, year },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching month orders:", error);
    throw error.response?.data || error;
  }
};

// ==================== DOWNLOAD PROFORMA INVOICE ====================
export const getOrderInvoiceApi = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/orderinvoice/${orderId}`, {
      responseType: "blob",
    });
    return res;
  } catch (error) {
    console.error("Error downloading invoice:", error);
    throw error.response?.data || error;
  }
};

// ==================== DOWNLOAD FINAL BILL (TAX INVOICE) ====================
export const getFinalBillApi = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/finalbill/${orderId}`, {
      responseType: "blob",
    });
    return res;
  } catch (error) {
    console.error("Error downloading final bill:", error);
    throw error.response?.data || error;
  }
};

// ==================== GET PAYMENT HISTORY ====================
export const getPaymentHistoryApi = async (orderId) => {
  try {
    const res = await axiosInstance.get(`/getpaymenthistory/${orderId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error.response?.data || error;
  }
};


export const downloadOrdersPDF = async ({ CompanyId, startDate, endDate }) => {
  try {
    const params = {
      CompanyId: getCompanyId(),
      startDate,
      endDate,
    };
    const response = await axiosInstance.get("/export-overall-orders-pdf", {
      params,
      responseType: "blob", // important for file downloads
    });

    // Create a blob and trigger download
    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `Orders_${CompanyId || "All"}_${Date.now()}.pdf`;
    link.click();

    // Optional: cleanup
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading Orders PDF:", error);
    alert("Failed to download Orders PDF. Check console for details.");
  }
};

{/*----------------get All Orders-------------------------------- */ }
export const getAllOrdersApi = async () => {
  try {
    const response = await axiosInstance.get("/getorders", {
      params: { CompanyId: getCompanyId() }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};