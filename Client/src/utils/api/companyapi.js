import axiosInstance from "../axiosInstance";

/**
 * Update company details
 * @param {string} companyId - Company ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated company data
 */
export const updateCompany = async (companyId, updates) => {
    try {
        const res = await axiosInstance.put(`/updatecompany/${companyId}`, updates);
        return res.data;
    } catch (err) {
        console.error("Update company error:", err);
        throw err;
    }
};

/**
 * Get company details by ID
 * @param {string} companyId - Company ID
 * @returns {Promise<object>} Company data
 */
export const getCompanyById = async (companyId) => {
    try {
        const res = await axiosInstance.get(`/getcompany/${companyId}`);
        return res.data;
    } catch (err) {
        console.error("Get company error:", err);
        throw err;
    }
};
