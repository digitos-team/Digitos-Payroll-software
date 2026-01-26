import express from "express";
import {
  addRevenue,
  deleteRevenue,
  getAllRevenue,
  getRevenueById,
  getRevenueByOrderId,
  getTotalRevenue,
  updateRevenue,
  getMonthlyRevenue,
  getMonthRevenue,
} from "../controller/RevenueController.js";

import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";

const RevenueRoutes = express.Router();

// -------------------- ADMIN ONLY --------------------
// Admin can add revenue manually (CA should not)
RevenueRoutes.post(
  "/addrevenue",
  verifyToken,
  authorizeRoles("Admin"),
  addRevenue
);

// -------------------- ADMIN + CA --------------------
// Both can view revenue records and totals

RevenueRoutes.get(
  "/getrevenue",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getAllRevenue
);

RevenueRoutes.post(
  "/getrevenuebyid",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getRevenueById
);
RevenueRoutes.get(
  "/getrevenuebyorder/:orderId",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getRevenueByOrderId
);

RevenueRoutes.put(
  "/upaterevenue",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  updateRevenue
);

RevenueRoutes.delete(
  "/deleterevenue",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  deleteRevenue
);

RevenueRoutes.post(
  "/gettotalrevenue/:CompanyId",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getTotalRevenue
);

// -------------------- MONTHLY REVENUE --------------------
RevenueRoutes.get(
  "/getmonthlyrevenue",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getMonthlyRevenue
);

RevenueRoutes.get(
  "/monthlywisedetails",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getMonthRevenue
);

export { RevenueRoutes };
