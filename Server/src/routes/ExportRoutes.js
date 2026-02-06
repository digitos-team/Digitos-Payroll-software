import express from "express";
import {
  exportMonthlyRevenuePDF,
  exportMonthlyExpensesPDF,
  exportMonthlyOrdersPDF,
  exportMonthlyPurchasesPDF,
  exportComprehensiveMonthlyReportPDF,
  exportAnnualReportPDF,
  generateSalaryReportPDF,
  exportMonthlyPayrollPDF,
  exportOverallOrdersPDF,
  exportThreeMonthSalaryReportPDF,
} from "../controller/ExportController.js";

import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";

const ExportRoutes = express.Router();

// -------------------- MONTHLY PDF EXPORTS --------------------

ExportRoutes.get(
  "/export-monthly-revenue-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportMonthlyRevenuePDF
);

ExportRoutes.get(
  "/export-monthly-expenses-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportMonthlyExpensesPDF
);

ExportRoutes.get(
  "/export-monthly-orders-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportMonthlyOrdersPDF
);

ExportRoutes.get(
  "/export-monthly-purchases-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportMonthlyPurchasesPDF
);

// Export Comprehensive Monthly Report PDF
ExportRoutes.get(
  "/monthlycomprehensivepdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportComprehensiveMonthlyReportPDF
);

// Export Annual Report PDF
ExportRoutes.get(
  "/annualreportpdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportAnnualReportPDF
);

// [FIXED] Added verifyToken and authorizeRoles here
ExportRoutes.get(
  "/generatesalaryreportpdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  generateSalaryReportPDF
);

// [FIXED] Added verifyToken and authorizeRoles here
ExportRoutes.get(
  "/export-monthly-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportMonthlyPayrollPDF
);

ExportRoutes.get(
  "/export-overall-orders-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportOverallOrdersPDF
);

ExportRoutes.get(
  "/export-three-month-salary-pdf",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  exportThreeMonthSalaryReportPDF
);

export { ExportRoutes };