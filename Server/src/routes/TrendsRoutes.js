import express from "express";
import {
  getOrderVsExpenseTrend,
  getProfitVsExpenseTrend,
  getProfitVsPayrollTrend,
  getRevenueVsExpenseTrend,
} from "../controller/TrendsController.js";

const TrendsRoutes = express.Router();

TrendsRoutes.get("/profit-expense", getProfitVsExpenseTrend);
TrendsRoutes.get("/profit-payroll", getProfitVsPayrollTrend);
TrendsRoutes.get("/order-expense", getOrderVsExpenseTrend);
TrendsRoutes.get("/revenue-vs-expense", getRevenueVsExpenseTrend);
export { TrendsRoutes };
