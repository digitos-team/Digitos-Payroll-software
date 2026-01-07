import axiosInstance from '../../../../utils/axiosInstance';

// -------------------- Get All Employees --------------------
export const getAllEmployees = async (companyId) => {
  try {
    // Extract actual ID if companyId is an object
    const actualCompanyId = companyId?._id || companyId;

    const params = {
      CompanyId: actualCompanyId,
      role: "Employee" // Strictly fetch only Employees
    };

    console.log("Fetching employees with params:", params);
    const res = await axiosInstance.get("/getallusers", { params });
    console.log("Employees API response:", res.data);

    return { data: res.data.users || [] };
  } catch (err) {
    console.error("Error fetching employees:", err);
    return { data: [] };
  }
};

// -------------------- Get User by ID --------------------
export const getUserById = async (id) => {
  try {
    // FIXED: Use the correct endpoint with URL param
    const res = await axiosInstance.get(`/getuserbyid/${id}`);
    
    if (!res.data.user) {
      console.warn(`User with ID ${id} not found`);
      return { data: null, error: "User not found" };
    }

    return { data: res.data.user };
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    return { data: null, error: err.message };
  }
};

// -------------------- Count Employees --------------------
export const getEmployeeCount = async (companyId) => {
  try {
    // Extract actual ID if companyId is an object
    const actualCompanyId = companyId?._id || companyId;

    console.log("getEmployeeCount - CompanyId:", actualCompanyId);
    const res = await axiosInstance.get("/countemployees", {
      params: { CompanyId: actualCompanyId }
    });
    console.log("getEmployeeCount - Full response:", res);
    console.log("getEmployeeCount - Response data:", res.data);
    return { data: res.data };
  } catch (err) {
    console.error("Error counting employees:", err);
    console.error("Error response:", err.response?.data);
    return { data: null, error: err.message };
  }
};

// -------------------- Update User --------------------
export const updateUser = async (id, updatedData) => {
  try {
    // Check if updatedData is already FormData (from modal)
    let formData;
    
    if (updatedData instanceof FormData) {
      // Already FormData - use it directly
      console.log("Received FormData from modal");
      formData = updatedData;
    } else {
      // Plain object - convert to FormData (legacy support)
      console.log("Converting plain object to FormData");
      formData = new FormData();

      Object.keys(updatedData).forEach((key) => {
        if (key === "BankDetails" && updatedData.BankDetails) {
          // Append nested bank details
          Object.keys(updatedData.BankDetails).forEach((bKey) => {
            const val = updatedData.BankDetails[bKey];
            if (val !== undefined && val !== null && val !== "") {
              formData.append(`BankDetails[${bKey}]`, val);
            }
          });
        } else if (key === "Documents" && updatedData.Documents) {
          // Handle document uploads
          if (updatedData.Documents.BankPassbook) {
            formData.append("BankPassbook", updatedData.Documents.BankPassbook);
          }
          if (updatedData.Documents.AadhaarCard) {
            formData.append("AadhaarCard", updatedData.Documents.AadhaarCard);
          }
          if (updatedData.Documents.PANCard) {
            formData.append("PANCard", updatedData.Documents.PANCard);
          }
          if (updatedData.Documents.Marksheets && updatedData.Documents.Marksheets.length > 0) {
            updatedData.Documents.Marksheets.forEach((file) => {
              formData.append("Marksheets", file);
            });
          }
        } else if (key === "ProfilePhoto") {
          if (updatedData.ProfilePhoto && typeof updatedData.ProfilePhoto === 'object') {
            formData.append("ProfilePhoto", updatedData.ProfilePhoto);
          }
        } else if (updatedData[key] !== undefined && updatedData[key] !== null && updatedData[key] !== "") {
          formData.append(key, updatedData[key]);
        }
      });
    }

    // Log what we're sending
    console.log("Sending update to backend:");
    for (let pair of formData.entries()) {
      console.log(` - ${pair[0]}:`, pair[1]);
    }

    // FIXED: Send id in URL params, not body
    const res = await axiosInstance.put(`/updateuser/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data };
  } catch (err) {
    console.error("Error updating user:", err);
    console.error("Error response:", err.response?.data);
    return { data: null, error: err.message };
  }
};

// -------------------- Delete User --------------------
export const deleteUser = async (id) => {
  try {
    // FIXED: Send id in URL params, not body
    // Backend route is: /deleteuser/:id
    const res = await axiosInstance.delete(`/deleteuser/${id}`);
    return { data: res.data };
  } catch (err) {
    console.error("Error deleting user:", err);
    return { data: null, error: err.message };
  }
};