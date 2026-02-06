// src/api/employeeApi.js
import axiosInstance from "../axiosInstance";


export const addEmployee = async (data, CompanyId) => {
  let formData;

  // Check if data is already a FormData object
  if (data instanceof FormData) {
    formData = data;
    // Append company id if not already present
    if (CompanyId && !formData.has("CompanyId")) {
      formData.append("CompanyId", CompanyId);
    }
  } else {
    // Build FormData to support file upload (ProfilePhoto, Documents) and nested BankDetails
    formData = new FormData();

    // Append top-level fields
    Object.keys(data).forEach((key) => {
      if (key === "BankDetails" && data.BankDetails) {
        // Append nested bank details as BankDetails[field]
        Object.keys(data.BankDetails).forEach((bKey) => {
          const val = data.BankDetails[bKey];
          if (val !== undefined && val !== null && val !== "") {
            formData.append(`BankDetails[${bKey}]`, val);
          }
        });
      } else if (key === "Documents" && data.Documents) {
        // Handle document uploads
        if (data.Documents.BankPassbook) {
          formData.append("BankPassbook", data.Documents.BankPassbook);
        }
        if (data.Documents.AadhaarCard) {
          formData.append("AadhaarCard", data.Documents.AadhaarCard);
        }
        if (data.Documents.PANCard) {
          formData.append("PANCard", data.Documents.PANCard);
        }
        if (data.Documents.Marksheets && data.Documents.Marksheets.length > 0) {
          data.Documents.Marksheets.forEach((file) => {
            formData.append("Marksheets", file);
          });
        }
        if (data.Documents.OtherDocuments && data.Documents.OtherDocuments.length > 0) {
          data.Documents.OtherDocuments.forEach((file) => {
            formData.append("OtherDocuments", file);
          });
        }
      } else if (key === "ProfilePhoto") {
        // File input (may be null or File)
        if (data.ProfilePhoto) {
          formData.append("ProfilePhoto", data.ProfilePhoto);
        } else {
          // ensure backend receives an empty string if none
          formData.append("ProfilePhoto", "");
        }
      } else if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
        formData.append(key, data[key]);
      }
    });

    // Append company id
    if (CompanyId) formData.append("CompanyId", CompanyId);
  }



  // Send multipart/form-data. Let axios set the Content-Type boundary automatically.
  const res = await axiosInstance.post("/adduser", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};


// -------------------- Get All Employees --------------------
export const getAllEmployees = async (role, CompanyId) => {
  try {
    const params = { CompanyId };
    if (role) params.role = role;

    const res = await axiosInstance.get("/getallusers", { params });

    // Backend returns array directly
    return { data: res.data };
  } catch (err) {
    console.error("Error fetching employees:", err);
    if (err.response?.status === 404) {
      console.warn("Employees endpoint not found (404)");
    }
    return { data: [] };
  }
};

// -------------------- Get Employee by ID --------------------
export const getEmployeeById = async (id) => {
  try {

    // Since /getuserbyid doesn't exist, use /getallusers and filter
    const res = await axiosInstance.get("/getallusers");

    // Backend returns {success: true, users: Array}
    const users = res.data.users || res.data.data || res.data || [];

    // Find the user with matching ID
    const user = users.find(u => {
      return u._id === id || u.id === id;
    });

    if (!user) {
      console.error('❌ getEmployeeById - User not found. Available IDs:', users.map(u => u._id || u.id));
      throw new Error(`User with ID ${id} not found`);
    }

    return user;
  } catch (err) {
    console.error('❌ getEmployeeById - Error:', err);
    throw err.response?.data || err;
  }
};

// -------------------- Update Employee --------------------
export const updateEmployee = async (arg1, arg2) => {
  try {
    let userId;
    let data;

    // Check if called as (id, data) or just (data)
    if (arg2) {
      userId = arg1;
      data = arg2;
    } else {
      data = arg1;
      userId = data._id || data.id;
    }

    if (!userId) {
      throw new Error("User ID is required for update");
    }

    // Prepare FormData
    let formData;

    if (data instanceof FormData) {
      formData = data;
    } else {
      // Convert plain object to FormData
      formData = new FormData();
      Object.keys(data).forEach((key) => {
        // Skip _id and id as they're in the URL
        if (key === "_id" || key === "id") {
          return;
        }

        if (key === "BankDetails" && data.BankDetails) {
          // Append nested bank details
          Object.keys(data.BankDetails).forEach((bKey) => {
            const val = data.BankDetails[bKey];
            if (val !== undefined && val !== null && val !== "") {
              formData.append(`BankDetails[${bKey}]`, val);
            }
          });
        } else if (key === "Documents" && data.Documents) {
          // Handle document uploads
          if (data.Documents.BankPassbook) {
            formData.append("BankPassbook", data.Documents.BankPassbook);
          }
          if (data.Documents.AadhaarCard) {
            formData.append("AadhaarCard", data.Documents.AadhaarCard);
          }
          if (data.Documents.PANCard) {
            formData.append("PANCard", data.Documents.PANCard);
          }
          if (data.Documents.Marksheets && data.Documents.Marksheets.length > 0) {
            data.Documents.Marksheets.forEach((file) => {
              formData.append("Marksheets", file);
            });
          }
          if (data.Documents.OtherDocuments && data.Documents.OtherDocuments.length > 0) {
            data.Documents.OtherDocuments.forEach((file) => {
              formData.append("OtherDocuments", file);
            });
          }
        } else if (key === "ProfilePhoto") {
          // Only append if it's a file (not null or empty string)
          if (data.ProfilePhoto && typeof data.ProfilePhoto === 'object') {
            formData.append("ProfilePhoto", data.ProfilePhoto);
          }
        } else if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          formData.append(key, data[key]);
        }
      });
    }

    // Include user ID in URL path to match backend endpoint: PUT /updateuser/:id
    const res = await axiosInstance.put(`/updateuser/${userId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (err) {
    console.error("Error updating employee:", err);
    throw err;
  }
};

// -------------------- Delete Employee --------------------
export const deleteEmployee = async (id) => {
  try {
    const res = await axiosInstance.delete(`/deleteuser/${id}`);
    return res.data; // { success, message }
  } catch (err) {
    throw err.response?.data || err;
  }
};

// -------------------- Count Employees --------------------
// -------------------- Count Employees --------------------
export const getEmployeeCount = async (CompanyId) => {
  try {
    const res = await axiosInstance.get("/countemployees", {
      params: { CompanyId },
    });
    return res.data; // { success, totalEmployees, message }
  } catch (err) {
    throw err.response?.data || err;
  }
};

// -------------------- Count Employees by Department --------------------
export const getEmployeeCountByDepartment = async (CompanyId) => {
  try {
    const res = await axiosInstance.get("/countemployeesbydepartment", {
      params: { CompanyId },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
