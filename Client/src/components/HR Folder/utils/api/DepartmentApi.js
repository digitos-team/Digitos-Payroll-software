import axiosInstance from '../../../../utils/axiosInstance';

export const getDepartmentCount = async (companyId) => {
    try {
        // Extract actual ID if companyId is an object
        const actualCompanyId = companyId?._id || companyId;

        console.log("Fetching department count for CompanyId:", actualCompanyId);
        const res = await axiosInstance.get(`/countdepartment/${actualCompanyId}`);
        console.log("Department Count API response:", res.data);

        return { data: res.data };
    } catch (err) {
        console.error("Error fetching department count:", err);
        return { data: null, error: err.message };
    }
};

export const getDepartmentsByCompany = async (companyId) => {
    try {
        // Extract actual ID if companyId is an object
        const actualCompanyId = companyId?._id || companyId;

        console.log("Fetching departments for CompanyId:", actualCompanyId);
        const res = await axiosInstance.post("/getdepartment", { CompanyId: actualCompanyId });
        console.log("Departments API response:", res.data);
        return res;
    } catch (err) {
        console.error("Error fetching departments:", err);
        return { data: { success: false, data: [] } };
    }
};

export const getDesignationsByCompany = async (companyId) => {
    try {
        // Extract actual ID if companyId is an object
        const actualCompanyId = companyId?._id || companyId;

        console.log("Fetching designations for CompanyId:", actualCompanyId);
        const res = await axiosInstance.post("/getdesignationbycompany", { CompanyId: actualCompanyId });
        console.log("Designations API response:", res.data);
        return res;
    } catch (err) {
        console.error("Error fetching designations:", err);
        return { data: { success: false, data: [] } };
    }
};