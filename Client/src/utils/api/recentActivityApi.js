import axiosInstance from "../axiosInstance";

/**
 * Fetch recent activities for a company
 * @param {string} CompanyId - The company ID
 * @param {number} limit - Number of activities to fetch (default: 10)
 * @returns {Promise<Array>} Array of recent activities
 */
export const getRecentActivities = async (CompanyId, limit = 10) => {
    try {
        const res = await axiosInstance.get("/recentactivities", {
            params: { CompanyId, limit },
        });

        if (res.data?.success) {
            return res.data.data || [];
        }
        return [];
    } catch (err) {
        console.error("Error fetching recent activities:", err);
        return [];
    }
};
