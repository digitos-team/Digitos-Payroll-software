import express from "express";
import {
  addOrder,
  confirmOrder,
  deleteOrder,
  getOrders,
  updateOrder,
  getOrderById,
  getMonthlyOrders,
  getMonthOrders,
  exportOrderInvoice,
  exportFinalBill,
  recordPayment,
  getPaymentHistory
} from "../controller/OrderController.js";

const OrderRoutes = express.Router();

OrderRoutes.post("/addorders", addOrder); // Add new order
OrderRoutes.get("/getorders", getOrders); // Get orders by company
OrderRoutes.get("/getorder/:id", getOrderById); // Get specific order by ID
OrderRoutes.post("/recordpayment", recordPayment); // Record a payment for an order
OrderRoutes.put("/confirm-order", confirmOrder); // Update order status
OrderRoutes.put("/update-order", updateOrder); // Update order details
OrderRoutes.delete("/deleteorder", deleteOrder); // Delete order
OrderRoutes.get("/getpaymenthistory/:orderId", getPaymentHistory); // Get payment history for an order
// -------------------- MONTHLY ORDERS --------------------
OrderRoutes.get("/monthwiseorders", getMonthlyOrders); // Get monthly summary
OrderRoutes.get("/monthlydetails", getMonthOrders); // Get specific month details

OrderRoutes.get("/orderinvoice/:id", exportOrderInvoice);
OrderRoutes.get("/paymentinvoice/:id", exportFinalBill);
OrderRoutes.get("/finalbill/:id", exportFinalBill);

export { OrderRoutes };
