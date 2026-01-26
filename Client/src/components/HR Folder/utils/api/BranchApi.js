import axiosInstance from '../../../../utils/axiosInstance';

export const getBranchCount = async (companyId) => {
    try {
        // Extract actual ID if companyId is an object
        const actualCompanyId = companyId?._id || companyId;

        console.log("Fetching branch count for CompanyId:", actualCompanyId);
        const res = await axiosInstance.get(`/countbranches/${actualCompanyId}`);
        console.log("Branch Count API response:", res.data);

        return { data: res.data };
    } catch (err) {
        console.error("Error fetching branch count:", err);
        return { data: null, error: err.message };
    }
};

export const getBranchesByCompany = async (companyId) => {
    try {
        // Extract actual ID if companyId is an object
        const actualCompanyId = companyId?._id || companyId;

        console.log("Fetching branches for CompanyId:", actualCompanyId);
        const res = await axiosInstance.post("/getbranchbycompany", {
            CompanyId: actualCompanyId,
        });
        return res;
    } catch (err) {
        console.error("Error fetching branches:", err);
        return { data: [] };
    }
};

export const getBranchWiseMonthlyPayroll = async (companyId, monthYear) => {
    try {
        // Extract actual ID if companyId is an object
        const actualCompanyId = companyId?._id || companyId;

        console.log("Fetching branch-wise payroll for CompanyId:", actualCompanyId, "Month:", monthYear);
        const res = await axiosInstance.get("/getbranchwisemonthlypayroll", {
            params: {
                CompanyId: actualCompanyId,
                Month: monthYear
            },
        });
        console.log("Branch-wise payroll response:", res.data);
        return res.data;
    } catch (err) {
        console.error("Error fetching branch-wise payroll:", err);
        return { success: false, data: [] };
    }
};