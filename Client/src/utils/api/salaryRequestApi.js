// src/utils/api/salaryRequestApi.js
import axiosInstance from "../axiosInstance";

/**
 * Get all salary slip requests
 * @param {string} CompanyId - Company ID
 * @param {string} status - Filter by status (pending, approved, rejected)
 * @returns {Promise} Requests data
 */
export const getSalarySlipRequests = async (CompanyId, status = null) => {
    try {
        const params = { CompanyId };
        if (status) params.status = status;

        const res = await axiosInstance.get("/getsalaryslipRequests", { params });
        return res.data;
    } catch (err) {
        console.error("Error fetching salary slip requests:", err);
        throw err.response?.data || err;
    }
};

/**
 * Update salary slip request status
 * @param {string} requestId - Request ID
 * @param {string} status - New status (approved/rejected)
 * @returns {Promise} Updated request
 */
export const updateRequestStatus = async (requestId, status) => {
    try {
        const res = await axiosInstance.post("/updatesalarysliprequest", {
            requestId,
            status,
        });
        return res.data;
    } catch (err) {
        console.error("Error updating request status:", err);
        throw err.response?.data || err;
    }
};

/**
 * Approve a salary slip request
 * @param {string} requestId - Request ID
 * @returns {Promise} Updated request
 */
export const approveRequest = async (requestId) => {
    return updateRequestStatus(requestId, "approved");
};

/**
 * Reject a salary slip request
 * @param {string} requestId - Request ID
 * @returns {Promise} Updated request
 */
export const rejectRequest = async (requestId) => {
    return updateRequestStatus(requestId, "rejected");
};
