import express from "express";
import { getPayrollHistory } from "../controller/GetPayrollHistory.js";


const PayrollHistoryRoutes = express.Router();

PayrollHistoryRoutes.get("/payrollhistory", getPayrollHistory);


export { PayrollHistoryRoutes };
