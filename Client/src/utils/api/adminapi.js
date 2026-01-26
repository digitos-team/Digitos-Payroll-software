import axiosInstance from "../axiosInstance";

/*----------------------Admin Fetching------------------- */
export const getAdminProfile = async () => {
  try {
    const res = await axiosInstance.get("/fetchdetails"); 
    return res.data; 
  } catch (err) {
    console.error("Admin profile fetch error:", err);
    return null;
  }
};

/*----------------------Admin Change Password------------------- */
export const changeAdminPassword = async (newPassword) => {
  try {
    const res = await axiosInstance.post("/changepassword", {
      password: newPassword,
    });
    return res.data;
  } catch (err) {
    console.error("Change password error:", err);
    return null;
  }
};