import axiosInstance from "../axiosInstance";

export const addSalaryHead = async (data, CompanyId) => {

    return axiosInstance.post("/addsalaryheads", { ...data, CompanyId });
};

export const fetchSalaryHeads = async (CompanyId) => {
    try {

        console.log("Fetching salary heads for CompanyId:", CompanyId);

        const response = await axiosInstance.post("/fetchsalaryhead", { CompanyId });
        console.log("Salary heads API response:", response.data);

        // Return the data array directly
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching salary heads:", error);
        if (error.response?.status === 404) {
            console.warn("Salary heads endpoint not found (404)");
        }
        throw error;
    }
};

export const deleteSalaryHead = async (SalaryHeadId, CompanyId) => {
    return axiosInstance.delete("/deletesalaryhead", {
        data: { SalaryHeadId, CompanyId },
    });
};
