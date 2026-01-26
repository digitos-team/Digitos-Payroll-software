import axiosInstance from '../../../../utils/axiosInstance';
import { store } from '../../../redux/MainStore';

// Helper to get companyId from Redux store
const getCompanyId = () => {
    const state = store.getState();
    return state.auth?.companyId?._id || state.auth?.companyId;
};

export const getSalarySettings = async (overrideCompanyId = null) => {
    const companyId = overrideCompanyId || getCompanyId();
    console.log("Fetching salary settings with companyId:", companyId);
    try {
        // Backend expects lowercase 'companyId'
        const response = await axiosInstance.post("/getsalarysettings", { companyId });
        console.log("Salary settings API response:", response.data);
        return response.data || [];
    } catch (error) {
        console.error("Error fetching salary settings:", error);
        console.error("Error response:", error.response?.data);
        // Return empty array on error to not break the UI
        return [];
    }
};

export const getEmployeeSalarySettings = async (employeeId, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.post("/getsalarysettings", {
            EmployeeID: employeeId,
            CompanyId
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching employee salary settings:", error);
        throw error;
    }
};

export const addOrUpdateSalarySetting = async (data) => {
    const CompanyId = data.CompanyId || getCompanyId();
    return axiosInstance.post("/addsalarysettings", {
        CompanyId,
        ...data
    });
};

export const deleteSalarySetting = async (id) => {
    const CompanyId = getCompanyId();
    return axiosInstance.delete("/deletesalarysetting", {
        data: { SalarySettingId: id, CompanyId },
    });
};

export const fetchSalaryRequests = async (overrideCompanyId = null) => {
    const companyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.post("/fetchsalaryrequests", { companyId });
        return response.data;
    } catch (error) {
        console.error("Error fetching salary requests:", error);
        throw error;
    }
};

export const approveSalaryRequest = async (requestId) => {
    try {
        const response = await axiosInstance.post("/approvesalaryrequest", { requestId });
        return response.data;
    } catch (error) {
        console.error("Error approving salary request:", error);
        throw error;
    }
};

export const rejectSalaryRequest = async (requestId, reason) => {
    try {
        const response = await axiosInstance.post("/rejectsalaryrequest", { requestId, reason });
        return response.data;
    } catch (error) {
        console.error("Error rejecting salary request:", error);
        throw error;
    }
};

export const calculateSalaryDetailed = async (employeeId, month, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    console.log("calculateSalaryDetailed - Sending:", { EmployeeID: employeeId, CompanyId, Month: month });
    try {
        const response = await axiosInstance.post("/calculatesalarydetailed", {
            EmployeeID: employeeId,
            CompanyId,
            Month: month
        });
        console.log("calculateSalaryDetailed - Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("calculateSalaryDetailed error:", error);
        console.error("calculateSalaryDetailed error response:", error.response?.data);

        const isAlreadyExists = error.response?.status === 400 &&
            (error.response?.data?.message?.toLowerCase().includes('already exists') ||
                error.response?.data?.message?.toLowerCase().includes('duplicate'));

        if (isAlreadyExists) {
            console.log("Salary slip already exists (fetching data):", error.response?.data?.message);
        }

        // Try to extract data from various possible locations
        let returnData = error.response?.data?.data;

        // Fallback: check if the response itself looks like a slip (has grossSalary or Earnings)
        if (!returnData && error.response?.data && (error.response.data.grossSalary !== undefined || error.response.data.Earnings)) {
            returnData = error.response.data;
        }

        // Return error response instead of throwing
        return {
            success: false,
            message: error.response?.data?.message || error.message,
            data: returnData
        };
    }
}
export const calculateSalaryForAll = async (month, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.post("/calculatesalaryforall", {
            CompanyId,
            Month: month
        });
        return response.data;
    } catch (error) {
        console.error("Error calculating salary for all:", error);
        if (error.response?.status === 404) {
            return { success: false, message: "No employees found" };
        }
        throw error;
    }
};

export const generatePayslipPDF = async (employeeId, month) => {
    const CompanyId = getCompanyId();
    try {
        const response = await axiosInstance.post("/generatesalaryslippdf", {
            EmployeeID: employeeId,
            Month: month,
            CompanyId
        }, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error("Error generating payslip PDF:", error);
        throw error;
    }
};

export const getAverageSalary = async (overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.post("/getavgsalary", { CompanyId });
        return response.data;
    } catch (error) {
        console.error("Error fetching average salary:", error);
        throw error;
    }
};

export const getPayrollTrend = async (overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.get("/payrolltrend", {
            params: { CompanyId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching payroll trend:", error);
        throw error;
    }
};

export const getDepartmentWiseSalary = async (month = null, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.get("/departmentwisesalary", {
            params: { CompanyId, Month: month }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching department wise salary:", error);
        throw error;
    }
};

export const getHighestPaidDepartment = async (month = null, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.get("/gethighestpaiddepartment", {
            params: { CompanyId, Month: month }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching highest paid department:", error);
        throw error;
    }
};

export const getPayrollByBranch = async (month, year, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        // Sending params in BOTH body and query string to Ensure compatibility 
        // whether the backend checks req.body (standard POST) or req.query (as per snippet).
        const payload = { CompanyId, month, year };

        const response = await axiosInstance.post("/payrollbybranch", payload, {
            params: payload
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching payroll by branch:", error);
        if (error.response) {
            console.error("Error Response Data:", error.response.data);
            console.error("Error Response Status:", error.response.status);
        }
        throw error;
    }
};

export const getTotalSalaryDistribution = async (month, overrideCompanyId = null) => {
    const CompanyId = overrideCompanyId || getCompanyId();
    try {
        const response = await axiosInstance.post("/gettotalsalarydistribution", {
            CompanyId,
            Month: month
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching total salary distribution:", error);
        if (error.response?.status === 404) {
            console.warn("Total salary distribution endpoint returned 404 (No data or not found).");
        }
        return null;
    }
};

export const getHRNotifications = async () => {
    try {
        const response = await axiosInstance.get("/hr-notifications");
        return response.data;
    } catch (error) {
        console.error("Error fetching HR notifications:", error);
        throw error;
    }
};

export const markNotificationRead = async (id) => {
    try {
        const response = await axiosInstance.post("/mark-notification-read", { id });
        return response.data;
    } catch (error) {
        console.error("Error marking notification read:", error);
        throw error;
    }
};

