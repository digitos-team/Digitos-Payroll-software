import express from "express";
import {
  getRevenueWithProfitByOrder,
  getTotalProfit,
  getTotalProfitfromTotalOrder,
} from "../controller/ProfitController.js";
import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";

const ProfitRoutes = express.Router();

// ---------------- ADMIN + CA can view ----------------

ProfitRoutes.post(
  "/getrevenuewithprofit",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getRevenueWithProfitByOrder
);

ProfitRoutes.get(
  "/gettotalprofitnet",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getTotalProfit
);

ProfitRoutes.post(
  "/gettotalprofitfromorder",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getTotalProfitfromTotalOrder
);

export { ProfitRoutes };
