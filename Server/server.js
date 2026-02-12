import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import fs from "fs";

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

Server.get("/ping", (req, res) => {
  res.json({ message: "pong", time: new Date().toISOString(), pid: process.pid });
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
const UPLOADS_PATH = path.resolve(__dirname, "uploads");
const CLIENT_DIST_PATH = path.resolve(__dirname, "../Client/dist");

console.log(`[Config] Serving uploads from: ${UPLOADS_PATH}`);
console.log(`[Config] Serving client from: ${CLIENT_DIST_PATH}`);

Server.use("/uploads", (req, res, next) => {
  // Debug logging
  const filePath = path.join(UPLOADS_PATH, req.path);
  if (!fs.existsSync(filePath)) {
    console.log(`[Warning] Upload file not found: ${req.path} (mapped to ${filePath})`);
  }
  next();
});

Server.use("/uploads", express.static(UPLOADS_PATH));
Server.use(express.static(CLIENT_DIST_PATH));

// ------------------ API/Uploads 404 (Prevent Fallback) ------------------
// If anything under /api or /uploads reaches here, it's a 404, NOT an app route
Server.use(["/api", "/uploads"], (req, res) => {
  res.status(404).json({ success: false, message: "Resource not found" });
});

// ------------------ React Router fallback ------------------
Server.get(/.*/, (req, res) => {
  res.sendFile(path.join(CLIENT_DIST_PATH, "index.html"));
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
