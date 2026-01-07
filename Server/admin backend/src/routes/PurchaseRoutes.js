import express from "express";
import {
  getPurchases,
  // getPurchaseStats,
  getMonthlyPurchases,
  getMonthPurchases,
  // getOrderWithExpenses,
  getPurchasesWithOrdersExpense,
  // getMonthPurchases,
} from "../controller/PurchaseController.js";

import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";
const PurchaseRoutes = express.Router();

// -------------------- ADMIN ONLY --------------------

// -------------------- ADMIN + CA --------------------
// Both Admin and CA can view purchases
PurchaseRoutes.get(
  "/getpurchases",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getPurchases
);
// PurchaseRoutes.get("/getpurchasebyorderid/:id", getPurchaseByOrderId);
// PurchaseRoutes.get("/getpurchasestats", getPurchaseStats);

// -------------------- MONTHLY PURCHASES --------------------
PurchaseRoutes.get(
  "/getmonthlypurchases",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getMonthlyPurchases
);
PurchaseRoutes.get(
  "/getmonthpurchases",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getMonthPurchases
);
PurchaseRoutes.get(
  "/getpurchaseswithordersexpense/:orderId",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getPurchasesWithOrdersExpense
);

export { PurchaseRoutes };
