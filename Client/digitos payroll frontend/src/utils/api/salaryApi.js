// src/utils/api/salaryApi.js
import axiosInstance from "../axiosInstance";

/**
 * Get salary history for an employee
 * @param {string} EmployeeID - Employee ID
 * @param {string} CompanyId - Company ID
 * @returns {Promise} Salary history data
 */
export const getSalaryHistory = async (EmployeeID, CompanyId) => {
    try {
        const res = await axiosInstance.get("/payrollhistory", {
            params: { EmployeeID, CompanyId },
        });
        return res.data;
    } catch (err) {
        console.error("Error fetching salary history:", err);
        throw err.response?.data || err;
    }
};

/**
 * Request approval to download salary slip
 * @param {string} EmployeeID - Employee ID
 * @param {string} Month - Month in YYYY-MM format
 * @param {string} CompanyId - Company ID
 * @returns {Promise} Request response
 */
export const requestSlipApproval = async (EmployeeID, Month, CompanyId) => {
    try {
        console.log('📤 API - Requesting slip approval:', { EmployeeID, Month, CompanyId });

        const res = await axiosInstance.post("/requestsalaryslip", {
            EmployeeID,
            Month,
            CompanyId,
        });

        console.log('✅ API - Request response:', res.data);
        return res.data;
    } catch (err) {
        console.error("❌ API - Error requesting salary slip:", err);
        console.error("❌ API - Error response:", err.response?.data);

        // If backend returns error with existing request status
        if (err.response?.data?.status) {
            throw {
                message: err.response.data.message,
                status: err.response.data.status,
                alreadyExists: true
            };
        }

        throw err.response?.data || err;
    }
};

/**
 * Download salary slip PDF
 * @param {string} EmployeeID - Employee ID
 * @param {string} Month - Month in YYYY-MM format
 * @returns {Promise} PDF blob
 */
export const downloadSlipPDF = async (EmployeeID, Month) => {
    try {
        console.log('📥 API - Downloading slip PDF:', { EmployeeID, Month });

        const res = await axiosInstance.post(
            "/generatesalaryslippdf",
            { EmployeeID, Month },
            { responseType: "blob" }
        );

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Salary_Slip_${Month}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        console.log('✅ API - Download successful');
        return { success: true };
    } catch (err) {
        console.error("❌ API - Error downloading salary slip:", err);

        // Handle blob error response (need to convert to JSON)
        if (err.response?.data instanceof Blob) {
            try {
                const text = await err.response.data.text();
                const jsonError = JSON.parse(text);
                console.error("❌ API - Blob error parsed:", jsonError);

                throw {
                    message: jsonError.message,
                    needsRequest: jsonError.needsRequest,
                    status: jsonError.status
                };
            } catch (parseErr) {
                throw { message: 'Failed to download salary slip' };
            }
        }

        throw err.response?.data || err;
    }
};

/**
 * Get request status for a specific month
 * @param {string} EmployeeID - Employee ID
 * @param {string} Month - Month in YYYY-MM format
 * @param {string} CompanyId - Company ID
 * @returns {Promise} Request status object with status field
 */
export const getRequestStatus = async (EmployeeID, Month, CompanyId) => {
    try {
        console.log('📤 API - Getting request status:', { EmployeeID, Month, CompanyId });
        console.log('📤 API - Parameter types:', {
            EmployeeIDType: typeof EmployeeID,
            MonthType: typeof Month,
            CompanyIdType: typeof CompanyId
        });
        console.log('📤 API - Exact values:', JSON.stringify({ EmployeeID, Month, CompanyId }, null, 2));

        const res = await axiosInstance.get("/getsalaryslipRequests", {
            params: { EmployeeID, Month, CompanyId }
        });

        console.log('✅ API - Status response:', res.data);

        // Return the first matching request or default 'none' status
        const requests = res.data?.data || [];

        if (requests.length > 0) {
            const request = requests[0];
            console.log(`✅ API - Found request for ${Month}:`, request.status);
            return {
                status: request.status,
                requestedAt: request.requestedAt,
                approvedAt: request.approvedAt,
                rejectedAt: request.rejectedAt,
                _id: request._id
            };
        }

        console.log(`ℹ️ API - No request found for ${Month}, returning 'none'`);
        return { status: 'none' };
    } catch (err) {
        console.error("❌ API - Error fetching request status:", err);
        // Return 'none' if there's an error (likely means no request exists)
        return { status: 'none' };
    }
};