import { Expense } from "../models/ExpenseSchema.js";
import { Order } from "../models/OrderSchema.js";
import { Revenue } from "../models/RevenueSchema.js";
import { Company } from "../models/companySchema.js";
import mongoose from "mongoose";
import {
  generateFinalBill,
  generateOrderInvoice,
} from "../utils/InvoiceGenerator.js";
import path from "path";

// -------------------- Add Order (WITH GST AUTO-DETECTION) --------------------
const addOrder = async (req, res) => {
  try {
    const orderData = req.body;

    // ✅ Validation: ClientState is required for GST calculation
    if (!orderData.ClientState) {
      return res.status(400).json({
        message: "ClientState is required for GST calculation",
      });
    }

    // ✅ Validation: BaseAmount is required
    if (!orderData.BaseAmount || orderData.BaseAmount <= 0) {
      return res.status(400).json({
        message: "Valid BaseAmount is required",
      });
    }

    // ✅ Fetch Company to get CompanyState and GstNumber
    const company = await Company.findById(orderData.CompanyId);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    if (!company.CompanyState) {
      return res.status(400).json({
        message:
          "Company state information is incomplete. Please update company details.",
      });
    }

    // ✅ Auto-detect IsIGST based on state comparison
    orderData.IsIGST = company.CompanyState !== orderData.ClientState;

    // ✅ Set GSTType for clarity
    orderData.GSTType = orderData.IsIGST ? "IGST" : "CGST+SGST";

    // Create order (pre-save hooks will calculate GST)
    const order = new Order(orderData);
    await order.save();

    // Populate company details for response
    await order.populate("CompanyId", "CompanyName CompanyState GstNumber");

    res.status(201).json({
      message: "Order created successfully",
      order,
      orderNumber: order.OrderNumber,
      gstBreakdown: order.getGSTBreakdown(),
      transactionType: order.IsIGST ? "Interstate" : "Intrastate",
    });
  } catch (error) {
    console.error("Error in addOrder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Orders --------------------
const getOrders = async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId) {
      return res.status(400).json({ message: "CompanyId is required" });
    }

    const orders = await Order.find({ CompanyId })
      .populate("CompanyId", "CompanyName CompanyState GstNumber")
      .populate("CreatedBy", "Name Email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Confirm Order (With Payment) --------------------
const confirmOrder = async (req, res) => {
  try {
    const { id, amountReceived, paymentMethod, transactionId, notes } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!amountReceived || amountReceived <= 0) {
      return res
        .status(400)
        .json({ message: "Valid payment amount is required" });
    }

    const order = await Order.findById(id).populate("CompanyId", "CompanyName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.OrderStatus !== "Pending") {
      return res.status(400).json({ message: "Order is already confirmed" });
    }

    // ✅ Calculate new payment totals (rounded)
    const newAdvance = Math.round(order.AdvancePaid + amountReceived);
    const newBalance = Math.round(order.Amount - newAdvance);

    const finalBalance = Math.max(0, newBalance);

    // Determine payment status
    let paymentStatus;
    if (finalBalance === 0) {
      paymentStatus = "Paid";
    } else if (newAdvance > 0) {
      paymentStatus = "Partially Paid";
    } else {
      paymentStatus = "Pending";
    }

    // Add payment to history
    order.PaymentHistory.push({
      amount: amountReceived,
      date: new Date(),
      paymentMethod: paymentMethod || "Bank Transfer",
      transactionId: transactionId || "",
      notes: notes || "Order confirmation advance payment",
      recordedBy: req.user?.id || order.CreatedBy,
    });

    // Update order
    order.OrderStatus = "Confirmed";
    order.PaymentStatus = paymentStatus;
    order.AdvancePaid = newAdvance;
    order.BalanceDue = finalBalance;

    await order.save();

    // Create Revenue Record
    const revenue = new Revenue({
      OrderId: order._id,
      CompanyId: order.CompanyId,
      Source: order.ServiceTitle,
      Amount: amountReceived,
      RevenueDate: new Date(),
      PaymentMethod: paymentMethod || "Bank Transfer",
      TransactionId: transactionId || "",
      Notes: notes || "Order confirmation advance payment",
      AddedBy: req.user?.id || order.CreatedBy,
    });
    await revenue.save();

    res.json({
      message: "Order confirmed successfully",
      order,
      revenue,
      paymentDetails: {
        amountReceived,
        totalPaid: newAdvance,
        balanceDue: finalBalance,
        paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error in confirmOrder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Record Payment (Additional Payments) --------------------
const recordPayment = async (req, res) => {
  try {
    const { id, amount, paymentMethod, transactionId, notes } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Valid payment amount is required" });
    }

    const order = await Order.findById(id).populate("CompanyId", "CompanyName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.OrderStatus === "Pending") {
      return res.status(400).json({
        message: "Please confirm the order first before recording payments",
      });
    }

    if (order.PaymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already fully paid" });
    }

    if (amount > order.BalanceDue) {
      return res.status(400).json({
        message: `Payment amount (₹${amount}) exceeds balance due (₹${order.BalanceDue})`,
      });
    }

    // ✅ Calculate new totals (rounded)
    const newAdvance = Math.round(order.AdvancePaid + amount);
    const newBalance = Math.round(order.Amount - newAdvance);

    const finalBalance = Math.max(0, newBalance);

    // Determine payment status
    let paymentStatus = finalBalance === 0 ? "Paid" : "Partially Paid";

    // Add to payment history
    order.PaymentHistory.push({
      amount,
      date: new Date(),
      paymentMethod: paymentMethod || "Bank Transfer",
      transactionId: transactionId || "",
      notes: notes || "Payment recorded",
      recordedBy: req.user?.id || order.CreatedBy,
    });

    // Update order
    order.PaymentStatus = paymentStatus;
    order.AdvancePaid = newAdvance;
    order.BalanceDue = finalBalance;

    // ✅ Generate Tax Invoice Number if fully paid
    if (paymentStatus === "Paid" && !order.TaxInvoiceNumber) {
      const year = new Date().getFullYear();

      const lastInvoice = await Order.findOne({
        TaxInvoiceNumber: new RegExp(`^INV-${year}-`),
      })
        .sort({ TaxInvoiceNumber: -1 })
        .select("TaxInvoiceNumber");

      let nextNumber = 1;
      if (lastInvoice && lastInvoice.TaxInvoiceNumber) {
        const match = lastInvoice.TaxInvoiceNumber.match(/INV-\d{4}-(\d{4})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      order.TaxInvoiceNumber = `INV-${year}-${String(nextNumber).padStart(
        4,
        "0"
      )}`;
      order.BillGeneratedAt = new Date();
    }

    await order.save();

    // Create Revenue Record
    const revenue = new Revenue({
      OrderId: order._id,
      CompanyId: order.CompanyId,
      Source: order.ServiceTitle,
      Amount: amount,
      RevenueDate: new Date(),
      PaymentMethod: paymentMethod || "Bank Transfer",
      TransactionId: transactionId || "",
      Notes: notes || `Payment recorded - Balance: ₹${finalBalance}`,
      AddedBy: req.user?.id || order.CreatedBy,
    });
    await revenue.save();

    res.json({
      message:
        paymentStatus === "Paid"
          ? "Payment recorded. Order is now fully paid!"
          : "Payment recorded successfully",
      order,
      revenue,
      paymentDetails: {
        amountReceived: amount,
        totalPaid: newAdvance,
        balanceDue: finalBalance,
        paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error in recordPayment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update Order (WITH STATE CHANGE HANDLING) --------------------
const updateOrder = async (req, res) => {
  try {
    const { id, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Prevent direct updates to financial fields
    const protectedFields = [
      "AdvancePaid",
      "BalanceDue",
      "PaymentHistory",
      "PaymentStatus",
    ];
    protectedFields.forEach((field) => {
      if (updates.hasOwnProperty(field)) {
        delete updates[field];
      }
    });

    // ✅ If ClientState is being updated, recalculate IsIGST
    if (updates.ClientState) {
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const company = await Company.findById(order.CompanyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Recalculate IsIGST based on new state
      updates.IsIGST = company.CompanyState !== updates.ClientState;
      updates.GSTType = updates.IsIGST ? "IGST" : "CGST+SGST";
    }

    const order = await Order.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("CompanyId", "CompanyName CompanyState GstNumber");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order updated successfully",
      order,
      gstBreakdown: order.getGSTBreakdown(),
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete Order --------------------
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Delete related records
    await Revenue.deleteMany({ OrderId: id });
    await Expense.updateMany({ OrderId: id }, { $unset: { OrderId: "" } });

    await Order.findByIdAndDelete(id);

    res.json({
      message:
        "Order deleted successfully. Related expenses unlinked, revenue removed.",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Order by ID --------------------
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("CompanyId", "CompanyName CompanyState GstNumber")
      .populate("CreatedBy", "Name Email")
      .populate("PaymentHistory.recordedBy", "Name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get related expenses
    const expenses = await Expense.find({ OrderId: id });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.Amount, 0);

    // Get revenue records
    const revenues = await Revenue.find({ OrderId: id }).sort({ createdAt: 1 });

    res.json({
      order,
      expenses,
      revenues,
      gstBreakdown: order.getGSTBreakdown(),
      summary: {
        totalExpenses,
        totalRevenue: order.AdvancePaid,
        estimatedProfit: order.AdvancePaid - totalExpenses,
        paymentPercentage: order.paymentPercentage,
      },
    });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- MONTHLY ORDERS --------------------
const getMonthlyOrders = async (req, res) => {
  try {
    const { CompanyId, year } = req.query;

    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    const filter = {
      createdAt: {
        $gte: new Date(`${selectedYear}-01-01`),
        $lt: new Date(`${selectedYear + 1}-01-01`),
      },
    };

    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const monthlyOrders = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          totalOrderValue: { $sum: "$Amount" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$OrderStatus", "Completed"] }, 1, 0] },
          },
          paidOrders: {
            $sum: { $cond: [{ $eq: ["$PaymentStatus", "Paid"] }, 1, 0] },
          },
          averageOrderValue: { $avg: "$Amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const formattedData = monthlyOrders.map((item) => {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return {
        month: monthNames[item._id.month - 1],
        monthNumber: item._id.month,
        year: item._id.year,
        totalOrders: item.totalOrders,
        totalOrderValue: Math.round(item.totalOrderValue),
        completedOrders: item.completedOrders,
        paidOrders: item.paidOrders,
        averageOrderValue: Math.round(item.averageOrderValue),
      };
    });

    res.status(200).json({
      year: selectedYear,
      data: formattedData,
      summary: {
        grandTotal: Math.round(
          formattedData.reduce((sum, item) => sum + item.totalOrderValue, 0)
        ),
        totalOrdersInYear: formattedData.reduce(
          (sum, item) => sum + item.totalOrders,
          0
        ),
        totalCompletedOrders: formattedData.reduce(
          (sum, item) => sum + item.completedOrders,
          0
        ),
        totalPaidOrders: formattedData.reduce(
          (sum, item) => sum + item.paidOrders,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error in getMonthlyOrders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get Month Orders --------------------
const getMonthOrders = async (req, res) => {
  try {
    const { CompanyId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const filter = {
      createdAt: { $gte: startDate, $lt: endDate },
    };

    if (CompanyId) filter.CompanyId = CompanyId;

    const orders = await Order.find(filter)
      .populate("CompanyId", "CompanyName CompanyState GstNumber")
      .populate("CreatedBy", "Name Email")
      .sort({ createdAt: -1 });

    const totalValue = Math.round(
      orders.reduce((sum, order) => sum + order.Amount, 0)
    );

    res.status(200).json({
      month: new Date(yearNum, monthNum - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      count: orders.length,
      totalValue,
      orders,
    });
  } catch (error) {
    console.error("Error in getMonthOrders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Export Proforma Invoice --------------------
const exportOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("CompanyId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const filePath = await generateOrderInvoice(order);

    if (!filePath || typeof filePath !== "string") {
      return res.status(500).json({ message: "Invalid file path generated" });
    }

    const fileName = `Order-Invoice-${order.OrderNumber || order._id}.pdf`;

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.log("Download error:", err);
        return res.status(500).json({ message: "Error downloading file" });
      }
    });
  } catch (error) {
    console.log("Invoice export error:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Export Final Bill (Tax Invoice) --------------------
const exportFinalBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("CompanyId")
      .populate("PaymentHistory.recordedBy", "Name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.PaymentStatus !== "Paid") {
      return res.status(400).json({
        message:
          "Final bill can only be generated after full payment is received",
        currentStatus: order.PaymentStatus,
        balanceDue: order.BalanceDue,
      });
    }

    const filePath = await generateFinalBill(order);

    if (!filePath || typeof filePath !== "string") {
      return res.status(500).json({ message: "Invalid file path generated" });
    }

    const fileName = `Tax-Invoice-${order.TaxInvoiceNumber || order._id}.pdf`;

    return res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        return res.status(500).json({ message: "Error downloading file" });
      }
    });
  } catch (error) {
    console.error("Final bill export error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// -------------------- Get Payment History --------------------
const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate(
      "PaymentHistory.recordedBy",
      "Name Email"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderId: order._id,
      clientName: order.ClientName,
      totalAmount: order.Amount,
      totalPaid: order.AdvancePaid,
      balanceDue: order.BalanceDue,
      paymentStatus: order.PaymentStatus,
      paymentHistory: order.PaymentHistory,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  addOrder,
  getOrders,
  confirmOrder,
  recordPayment,
  updateOrder,
  deleteOrder,
  getOrderById,
  getMonthlyOrders,
  getMonthOrders,
  exportOrderInvoice,
  exportFinalBill,
  getPaymentHistory,
};
