import express from 'express';
import { exportUsersCSV } from '../controller/CsvController.js';






const CsvRoutes = express.Router();

// CsvRoutes.get('/exportrevenue', exportRevenueCSV);
// CsvRoutes.get('/exportpurchases', exportPurchasesCSV);
// CsvRoutes.get('/exportexpenses', exportExpensesCSV);
// CsvRoutes.get('/exportprofit', exportProfitCSV);
// CsvRoutes.get("/export-monthly-csv", exportMonthlyPayrollCSV);
CsvRoutes.get("/export-users-csv", exportUsersCSV);
export {CsvRoutes}