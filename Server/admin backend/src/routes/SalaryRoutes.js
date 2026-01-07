import express from "express";
import {
  getTotalSalaryDistribution,
  getDepartmentWiseSalaryDistribution,
  getPayrollTrend,
  getHighestPaidDepartment,
  generateSalarySlipPDF,
  getAverageSalary,
  getPayrollByBranch,
  requestSalarySlip,
  updateSalarySlipRequest,
  getSalarySlipRequests,
} from "../controller/SalaryCalculateController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";
let SalaryRoutes = express.Router();

// SalaryRoutes.post("/calculatesalarybycompany", calculateSalaryByCompany);
// SalaryRoutes.post("/calculatesalarydetailed", calculateSalary);
SalaryRoutes.post("/gettotalsalarydistribution", getTotalSalaryDistribution);
// SalaryRoutes.post("/calculatesalaryforall",  calculateSalaryForAll);
SalaryRoutes.get("/departmentwisesalary", getDepartmentWiseSalaryDistribution);
SalaryRoutes.get("/payrolltrend", getPayrollTrend);
SalaryRoutes.get("/gethighestpaiddepartment", getHighestPaidDepartment);
SalaryRoutes.post("/generatesalaryslippdf", verifyToken, generateSalarySlipPDF);
SalaryRoutes.post("/getavgsalary", getAverageSalary);
SalaryRoutes.post("/payrollbybranch", getPayrollByBranch);
SalaryRoutes.post("/requestsalaryslip", verifyToken, requestSalarySlip);
SalaryRoutes.post("/updatesalarysliprequest",verifyToken,updateSalarySlipRequest)
SalaryRoutes.get("/getsalaryslipRequests", verifyToken,  getSalarySlipRequests);
export { SalaryRoutes };
