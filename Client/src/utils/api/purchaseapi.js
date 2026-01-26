import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";


const getCompanyId = () => {
    const state = store.getState();
    return state.auth?.companyId;
};

// -------------------- Get All Purchases --------------------

export const getPurchases = async () => {
    try {
        const CompanyId = getCompanyId();
        const res = await axiosInstance.get("/getpurchases", {
            params: { CompanyId }
        });
        return res.data?.data || [];
    } catch (err) {
        console.error("Error fetching purchases:", err);
        throw err;
    }
};

// -------------------- Get Monthly Purchases Summary --------------------
export const getMonthlyPurchases = async (year) => {
    try {
        const CompanyId = getCompanyId();
        const res = await axiosInstance.get("/getmonthlypurchases", {
            params: { CompanyId, year }
        });
        return res.data?.data || [];
    } catch (err) {
        console.error("Error fetching monthly purchases:", err);
        throw err;
    }
};

// -------------------- Get Purchases for a Specific Month --------------------
export const getMonthPurchases = async (month, year) => {
    try {
        const CompanyId = getCompanyId();
        const res = await axiosInstance.get("/getmonthpurchases", {
            params: { CompanyId, month, year }
        });
        return res.data?.data || [];
    } catch (err) {
        console.error("Error fetching month purchases:", err);
        throw err;
    }
};

// -------------------- Get Single Purchase with Orders Expense --------------------
export const getPurchasesWithOrdersExpense = async (orderId) => {
    try {
        const res = await axiosInstance.get(`/getpurchaseswithordersexpense/${orderId}`);
        return res.data?.data;
    } catch (err) {
        console.error("Error fetching purchase with expenses:", err);
        throw err;
    }
};

// -------------------- Add Purchase --------------------
// Note: This was not in the provided backend routes list but is used in Purchase.jsx
export const addPurchase = async (purchaseData) => {
    try {
        const CompanyId = getCompanyId();
        const payload = {
            ...purchaseData,
            CompanyId
        };
        const res = await axiosInstance.post("/addpurchase", payload);
        return res.data;
    } catch (err) {
        console.error("Error adding purchase:", err);
        throw err;
    }
};
