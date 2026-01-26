import express from "express";
import { loginUser } from "../controller/LoginController.js";


const LoginRoutes = express.Router();

// Single login route (works for Admin, HR, CA, Employee)
LoginRoutes.post("/login", loginUser);

export { LoginRoutes };
