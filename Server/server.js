import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";

// Routes
import { Adminroutes } from "./src/routes/Adminroutes.js";
import { Departmentroutes } from "./src/routes/Departmentroutes.js";
import { DesignationRoutes } from "./src/routes/DesignationRoutes.js";
import { Branchroutes } from "./src/routes/Branchroutes.js";
import { UserRoutes } from "./src/routes/UserRoutes.js";
import { LoginRoutes } from "./src/routes/LoginRoutes.js";
import { ExpenseRoutes } from "./src/routes/ExpenseRoutes.js";
import { SalaryHeadsRoutes } from "./src/routes/SalaryHeadRoutes.js";
import { OrderRoutes } from "./src/routes/OrderRoutes.js";
import { RevenueRoutes } from "./src/routes/RevenueRoutes.js";
import { ProfitRoutes } from "./src/routes/ProfitRoutes.js";
import { TaxRoutes } from "./src/routes/TaxRoutes.js";
import { PurchaseRoutes } from "./src/routes/PurchaseRoutes.js";
import SalarySettingRoutes from "./src/routes/SalarySettingRoutes.js";
import { SalaryRoutes } from "./src/routes/SalaryRoutes.js";
import { CsvRoutes } from "./src/routes/CsvRoutes.js";
import { ExportRoutes } from "./src/routes/ExportRoutes.js";
import { RecentActivitiesRoutes } from "./src/routes/RecentActivitiesRoutes.js";
import { PayrollHistoryRoutes } from "./src/routes/PayrollHistoryRoutes.js";
import { TrendsRoutes } from "./src/routes/TrendsRoutes.js";
import LeaveRoutes from "./src/routes/LeaveRoutes.js";
import AttendanceRoutes from "./src/routes/AttendanceRoutes.js";
import LeaveSettingRoutes from "./src/routes/LeaveSettingRoutes.js";
import HolidayRoutes from "./src/routes/HolidayRoutes.js";

// DB
import { connectToDatabase } from "./src/database/admindatabse.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Server = express();

// ------------------ Middleware ------------------
Server.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);
Server.use(express.json({ strict: false }));
Server.use(express.urlencoded({ extended: true }));

// Normalize null JSON bodies
Server.use((req, res, next) => {
  if (req.is("application/json") && req.body === null) req.body = {};
  next();
});

// ------------------ DB ------------------
connectToDatabase();

// ------------------ Mailer check ------------------
const mailerConfigured =
  process.env.SENDGRID_API_KEY ||
  (process.env.EMAIL_USER && process.env.EMAIL_PASS);

if (!mailerConfigured) {
  console.warn(
    "[Warning] Mailer not configured. Set SENDGRID_API_KEY or EMAIL_USER + EMAIL_PASS."
  );
} else {
  console.log("Mailer appears configured.");
}

// ------------------ API Routes ------------------
Server.use("/api", Adminroutes);
Server.use("/api", Departmentroutes);
Server.use("/api", DesignationRoutes);
Server.use("/api", Branchroutes);
Server.use("/api", UserRoutes);
Server.use("/api", LoginRoutes);
Server.use("/api", SalaryHeadsRoutes);
Server.use("/api", ExpenseRoutes);
Server.use("/api", OrderRoutes);
Server.use("/api", RevenueRoutes);
Server.use("/api", ProfitRoutes);
Server.use("/api", TaxRoutes);
Server.use("/api", PurchaseRoutes);
Server.use("/api", SalarySettingRoutes);
Server.use("/api", SalaryRoutes);
Server.use("/api", CsvRoutes);
Server.use("/api", ExportRoutes);
Server.use("/api", RecentActivitiesRoutes);
Server.use("/api", PayrollHistoryRoutes);
Server.use("/api", TrendsRoutes);
Server.use("/api", HolidayRoutes);
Server.use("/api", LeaveSettingRoutes);
Server.use("/api", AttendanceRoutes);
Server.use("/api", LeaveRoutes);

// ------------------ Static Files ------------------
Server.use("/uploads", express.static("uploads"));
// Serve static files from the React app
Server.use(express.static(path.join(__dirname, "../Client/dist")));

// ------------------ React Router fallback ------------------
Server.get(/^(?!\/api|\/uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/dist", "index.html"));
});

// ------------------ Error handler (LAST) ------------------
Server.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ------------------ Start server ------------------
const PORT = process.env.PORT || 6000;
Server.listen(PORT, () => {
  console.log(`Payroll server running on port ${PORT}`);
});
