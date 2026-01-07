import express from "express";
import {
  addUser,
  countEmployees,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
  countEmployeesByDepartment,
  updateHRProfile,
  getHRProfile,
  getEmployeeInfoById
} from "../controller/UserController.js";
import { upload, acceptAnyFile } from "../Middleware/upload.js";
import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";


const UserRoutes = express.Router();

// ADD USER
UserRoutes.post("/adduser", acceptAnyFile, addUser);

// GET ALL USERS
UserRoutes.get("/getallusers", getAllUsers);

// GET USER BY ID → FIXED
UserRoutes.get("/getuserbyid/:id", getUserById);

// UPDATE USER
UserRoutes.put("/updateuser/:id", verifyToken, acceptAnyFile, updateUser);

// DELETE USER

UserRoutes.delete("/deleteuser/:id", verifyToken, authorizeRoles("HR", "Admin"), deleteUser);

// COUNT EMPLOYEES
UserRoutes.get("/countemployees", countEmployees);

// COUNT BY DEPARTMENT
UserRoutes.get("/countemployeesbydepartment", countEmployeesByDepartment);

UserRoutes.get("/hr/profile", verifyToken, authorizeRoles("HR"), getHRProfile);

UserRoutes.put(
  "/hr/update-profile",
  verifyToken,
  authorizeRoles("HR"),
  acceptAnyFile,
  updateHRProfile
);

// ========================= Admin Routes (for all users) ========================= //

// Admin can update any user
UserRoutes.put(
  "/users/:id",
  verifyToken,
  authorizeRoles("Admin"),
  acceptAnyFile,
  updateUser
);

//==================================Get the Employee===========================//
UserRoutes.get("/employee/:id", getEmployeeInfoById)

export { UserRoutes };
