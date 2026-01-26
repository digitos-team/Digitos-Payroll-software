import axiosInstance from '../../../../utils/axiosInstance';

// Get HR Profile (Logged-in HR)
export const fetchHRProfile = async () => {
    try {
        const response = await axiosInstance.get("/hr/profile");
        return response.data;
    } catch (error) {
        console.error("Error fetching HR profile:", error);
        throw error;
    }
};

// Update HR Profile
export const updateHRProfile = async (formData) => {
    try {
        // Ensure formData is used for file uploads
        const response = await axiosInstance.put("/hr/update-profile", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating HR profile:", error);
        throw error;
    }
};
