import axiosInstance from "../axiosInstance";
import { store } from "../../components/redux/MainStore";

const getCompanyId = () => {
    const state = store.getState();
    const companyId = state.auth?.companyId;
    return companyId?._id || companyId;
};

// ==================== ADD EXPENSE ====================
export const addExpense = async (expenseData) => {
    try {
        const CompanyId = getCompanyId();

        // Create FormData for file upload
        const formData = new FormData();

        // Append all fields
        formData.append("ExpenseTitle", expenseData.ExpenseTitle);
        formData.append("Amount", expenseData.Amount);
        formData.append("ExpenseDate", expenseData.ExpenseDate);
        formData.append("CompanyId", CompanyId);
        // formData.append("AddedBy", expenseData.AddedBy);

        // Optional fields
        if (expenseData.OrderId) formData.append("OrderId", expenseData.OrderId);
        if (expenseData.ExpenseType) formData.append("ExpenseType", expenseData.ExpenseType);
        if (expenseData.PaymentMethod) formData.append("PaymentMethod", expenseData.PaymentMethod);
        if (expenseData.Description) formData.append("Description", expenseData.Description);

        // Append file if exists
        if (expenseData.Receipt) {
            formData.append("Receipt", expenseData.Receipt);
        }

        const res = await axiosInstance.post("/addexpense", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    } catch (err) {
        console.error("Error adding expense:", err);
        throw err;
    }
};

// ==================== GET ALL EXPENSES ====================
export const getAllExpenses = async (filters = {}) => {
    try {
        const CompanyId = getCompanyId();

        const params = {
            CompanyId,
            ...filters // Can include Status, ExpenseType
        };

        const res = await axiosInstance.get("/getallexpense", { params });
        return res.data || [];
    } catch (err) {
        console.error("Error fetching expenses:", err);
        return [];
    }
};

// ==================== GET EXPENSE BY ID ====================
export const getExpenseById = async (expenseId) => {
    try {
        const res = await axiosInstance.post("/getexpensebyid", {
            id: expenseId
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching expense by ID:", err);
        throw err;
    }
};

// ==================== UPDATE EXPENSE ====================
export const updateExpense = async (expenseId, expenseData) => {
    try {
        // Create FormData for file upload
        const formData = new FormData();

        // Append all fields that exist
        if (expenseData.ExpenseTitle) formData.append("ExpenseTitle", expenseData.ExpenseTitle);
        if (expenseData.Amount) formData.append("Amount", expenseData.Amount);
        if (expenseData.ExpenseDate) formData.append("ExpenseDate", expenseData.ExpenseDate);
        if (expenseData.OrderId) formData.append("OrderId", expenseData.OrderId);
        if (expenseData.ExpenseType) formData.append("ExpenseType", expenseData.ExpenseType);
        if (expenseData.PaymentMethod) formData.append("PaymentMethod", expenseData.PaymentMethod);
        if (expenseData.Description) formData.append("Description", expenseData.Description);

        // Append new file if exists
        if (expenseData.Receipt && expenseData.Receipt instanceof File) {
            formData.append("Receipt", expenseData.Receipt);
        }

        const res = await axiosInstance.put(`/updateexpense/${expenseId}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    } catch (err) {
        console.error("Error updating expense:", err);
        throw err;
    }
};

// ==================== DELETE EXPENSE ====================
export const deleteExpense = async (expenseId) => {
    try {
        const res = await axiosInstance.delete(`/delete-expense/${expenseId}`);
        return res.data;
    } catch (err) {
        console.error("Error deleting expense:", err);
        throw err;
    }
};

// ==================== GET TOTAL EXPENSE ====================
export const getTotalExpense = async () => {
    try {
        const CompanyId = getCompanyId();

        const res = await axiosInstance.post("/gettotalexpensesbycompany", {
            CompanyId
        });

        return res.data;
    } catch (err) {
        console.error("Error fetching total expense:", err);
        return {
            totalExpense: 0,
            totalRecords: 0
        };
    }
};

// ==================== GET EXPENSES BY ORDER ====================
export const getExpensesByOrder = async (orderId) => {
    try {
        const res = await axiosInstance.post("/getexpensesbyorder", {
            orderId
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching expenses by order:", err);
        return {
            expenses: [],
            totalExpense: 0,
            count: 0
        };
    }
};

// ==================== GET MONTHLY EXPENSES (Year Summary) ====================
export const getMonthlyExpenses = async (year) => {
    try {
        const CompanyId = getCompanyId();
        const selectedYear = year || new Date().getFullYear();

        const res = await axiosInstance.get("/monthwiseexpenses", {
            params: {
                CompanyId,
                year: selectedYear
            }
        });

        return res.data;
    } catch (err) {
        console.error("Error fetching monthly expenses:", err);
        return {
            year: year || new Date().getFullYear(),
            data: [],
            grandTotal: 0
        };
    }
};

// ==================== GET MONTH EXPENSES (Specific Month Details) ====================
export const getMonthExpenses = async (month, year) => {
    try {
        const CompanyId = getCompanyId();

        if (!month || !year) {
            throw new Error("Month and year are required");
        }

        const res = await axiosInstance.get("/monthlyexpenses", {
            params: {
                CompanyId,
                month,
                year
            }
        });

        return res.data;
    } catch (err) {
        console.error("Error fetching month expenses:", err);
        return {
            month: "",
            count: 0,
            totalAmount: 0,
            expenses: []
        };
    }
};

// ==================== HELPER: GET EXPENSES WITH FILTERS ====================
export const getFilteredExpenses = async (filters) => {
    try {
        const CompanyId = getCompanyId();

        const params = {
            CompanyId,
            ...(filters.Status && { Status: filters.Status }),
            ...(filters.ExpenseType && { ExpenseType: filters.ExpenseType }),
        };

        const res = await axiosInstance.get("/getallexpense", { params });
        return res.data || [];
    } catch (err) {
        console.error("Error fetching filtered expenses:", err);
        return [];
    }
};