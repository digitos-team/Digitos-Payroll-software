import express from "express";
import {
  addExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
<<<<<<< HEAD
  // updateExpenseStatus,
=======
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
  getTotalExpense,
  getExpensesByOrder,
  getMonthlyExpenses,
  getMonthExpenses,
<<<<<<< HEAD
} from "../controller/ExpenseController.js";
import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";
import { upload, acceptAnyFile } from "../Middleware/upload.js";
=======
  copyFixedExpenses,
  deferExpense,
} from "../controller/ExpenseController.js";
import { authorizeRoles, verifyToken } from "../Middleware/authMiddleware.js";
import { acceptAnyFile } from "../Middleware/upload.js";
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70

const ExpenseRoutes = express.Router();

// --------------------- ADMIN ONLY ---------------------
ExpenseRoutes.post(
  "/addexpense",
  (req, res, next) => {
    req.uploadFolder = "Receipt";
    next();
  },
  // Accept any file field name and normalize to req.file
  acceptAnyFile,
  verifyToken,
  authorizeRoles("Admin"),
  addExpense
);

ExpenseRoutes.put(
  "/updateexpense/:id",
  (req, res, next) => {
    req.uploadFolder = "Receipt";
    next();
  },
  // Accept any file field name (normalizes to req.file)
  acceptAnyFile,
  verifyToken,
  authorizeRoles("Admin"),
  updateExpense
);

ExpenseRoutes.delete(
  "/delete-expense/:id",
  verifyToken,
  authorizeRoles("Admin"),
  deleteExpense
);

<<<<<<< HEAD
// ExpenseRoutes.put(
//   "/expensestatus",
//   updateExpenseStatus
// );

=======
>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
// --------------------- ADMIN + CA ---------------------
ExpenseRoutes.get(
  "/getallexpense",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getAllExpenses
);

ExpenseRoutes.post(
  "/getexpensebyid",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getExpenseById
);

ExpenseRoutes.post(
  "/gettotalexpensesbycompany",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getTotalExpense
);
ExpenseRoutes.post(
  "/getexpensesbyorder",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getExpensesByOrder
);

// -------------------- MONTHLY EXPENSES --------------------
ExpenseRoutes.get(
  "/monthwiseexpenses",
  verifyToken,
  authorizeRoles("Admin", "CA"),
  getMonthlyExpenses
);

ExpenseRoutes.get(
  "/monthlyexpenses",
  // verifyToken,
  // authorizeRoles("Admin", "CA"),
  getMonthExpenses
);

<<<<<<< HEAD
=======
ExpenseRoutes.post(
  "/copy-fixed",
  verifyToken,
  authorizeRoles("Admin"),
  copyFixedExpenses
);

ExpenseRoutes.put(
  "/defer-expense/:id",
  verifyToken,
  authorizeRoles("Admin"),
  deferExpense
);

>>>>>>> eaefe27d612e3aba8cfde7d3a657375969450f70
export { ExpenseRoutes };
