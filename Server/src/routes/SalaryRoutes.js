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
<<<<<<< HEAD
  calculateSalary,         // Added
  calculateSalaryForAll    // Added
=======
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
} from "../controller/SalaryCalculateController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";
let SalaryRoutes = express.Router();

// SalaryRoutes.post("/calculatesalarybycompany", calculateSalaryByCompany);
<<<<<<< HEAD
// SalaryRoutes.post("/calculatesalarybycompany", calculateSalaryByCompany);
SalaryRoutes.post("/calculatesalarydetailed", calculateSalary);
SalaryRoutes.post("/gettotalsalarydistribution", getTotalSalaryDistribution);
SalaryRoutes.post("/calculatesalaryforall", calculateSalaryForAll);
=======
// SalaryRoutes.post("/calculatesalarydetailed", calculateSalary);
SalaryRoutes.post("/gettotalsalarydistribution", getTotalSalaryDistribution);
// SalaryRoutes.post("/calculatesalaryforall",  calculateSalaryForAll);
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
SalaryRoutes.get("/departmentwisesalary", getDepartmentWiseSalaryDistribution);
SalaryRoutes.get("/payrolltrend", getPayrollTrend);
SalaryRoutes.get("/gethighestpaiddepartment", getHighestPaidDepartment);
SalaryRoutes.post("/generatesalaryslippdf", verifyToken, generateSalarySlipPDF);
SalaryRoutes.post("/getavgsalary", getAverageSalary);
SalaryRoutes.post("/payrollbybranch", getPayrollByBranch);
SalaryRoutes.post("/requestsalaryslip", verifyToken, requestSalarySlip);
<<<<<<< HEAD
SalaryRoutes.post("/updatesalarysliprequest", verifyToken, updateSalarySlipRequest)
SalaryRoutes.get("/getsalaryslipRequests", verifyToken, getSalarySlipRequests);
=======
SalaryRoutes.post("/updatesalarysliprequest",verifyToken,updateSalarySlipRequest)
SalaryRoutes.get("/getsalaryslipRequests", verifyToken,  getSalarySlipRequests);
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
export { SalaryRoutes };
