import { Revenue } from "../models/RevenueSchema.js";
import mongoose from "mongoose";
const addRevenue = async (req, res) => {
  try {
    const {
      OrderId,
      CompanyId,
      Source,
      Amount,
      RevenueDate,
      Description,
      AddedBy,
    } = req.body;

    if (!Amount || !CompanyId) {
      return res.status(400).json({
        message: "Amount and CompanyId are required",
      });
    }

    const revenue = new Revenue({
      OrderId: OrderId || null,
      CompanyId,
      Source: Source || "Client Service",
      Amount,
      RevenueDate: RevenueDate || new Date(),
      Description: Description || "",
      AddedBy: AddedBy || null,
    });

    await revenue.save();

    res.status(201).json({
      message: "Revenue added successfully",
      revenue,
    });
  } catch (error) {
    console.error("Error in addRevenue:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllRevenue = async (req, res) => {
  try {
    const { CompanyId } = req.query;
console.log("QUERY CompanyId:", CompanyId);

    const filter = {};
    if (CompanyId) {
      filter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const revenues = await Revenue.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("AddedBy", "Name Email")
      .populate("OrderId", "ClientName ServiceTitle");

    res.status(200).json(revenues);
  } catch (error) {
    console.error("Error in getAllRevenue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRevenueById = async (req, res) => {
  try {
    const { id } = req.params;

    const revenue = await Revenue.findById(id)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle OrderStatus TotalAmount")
      .populate("AddedBy", "Name Email");

    if (!revenue) {
      return res.status(404).json({ message: "Revenue not found" });
    }

    res.status(200).json(revenue);
  } catch (error) {
    console.error("Error in getRevenueById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateRevenue = async (req, res) => {
  try {
    const { id, Amount, PaymentMode, Status } = req.body;

    const updatedData = {};
    if (Amount) updatedData.Amount = Amount;
    if (PaymentMode) updatedData.PaymentMode = PaymentMode;
    if (Status) updatedData.Status = Status;

    const revenue = await Revenue.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!revenue) {
      return res.status(404).json({ message: "Revenue not found" });
    }

    res.status(200).json({ message: "Revenue updated successfully", revenue });
  } catch (error) {
    console.error("Error in updateRevenue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteRevenue = async (req, res) => {
  try {
    const { id } = req.body;

    const revenue = await Revenue.findByIdAndDelete(id);

    if (!revenue) {
      return res.status(404).json({ message: "Revenue not found" });
    }

    res.status(200).json({ message: "Revenue deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRevenue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRevenueByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "OrderId is required" });
    }

    const revenues = await Revenue.find({ OrderId: orderId })
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle OrderStatus TotalAmount")
      .populate("AddedBy", "Name Email");

    if (!revenues || revenues.length === 0) {
      return res
        .status(404)
        .json({ message: "No revenue found for this order" });
    }

    res.status(200).json(revenues);
  } catch (error) {
    console.error("Error in getRevenueByOrderId:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Controller function
const getTotalRevenue = async (req, res) => {
  try {
    const { CompanyId } = req.params;

    // Validate companyId
    if (!CompanyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    const result = await Revenue.aggregate([
      {
        $match: { 
          CompanyId: new mongoose.Types.ObjectId(CompanyId) // ✅ FIXED: uppercase CompanyId + ObjectId conversion
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$Amount" },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      companyId: CompanyId,  // ✅ FIXED: use CompanyId variable
      totalRevenue: result[0]?.totalRevenue || 0,
      totalRecords: result[0]?.totalRecords || 0,
    });
  } catch (error) {
    console.error("Error in getTotalRevenueByCompany:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Export the function


// -------------------- MONTHLY REVENUE --------------------
const getMonthlyRevenue = async (req, res) => {
  try {
    const { CompanyId, year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    const matchFilter = {
      RevenueDate: {
        $gte: new Date(`${selectedYear}-01-01`),
        $lt: new Date(`${selectedYear + 1}-01-01`),
      },
    };

    // ✅ Proper ObjectId conversion (safe)
    if (CompanyId && mongoose.Types.ObjectId.isValid(CompanyId)) {
      matchFilter.CompanyId = new mongoose.Types.ObjectId(CompanyId);
    }

    const monthlyRevenue = await Revenue.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            month: { $month: "$RevenueDate" },
            year: { $year: "$RevenueDate" },
          },
          totalRevenue: { $sum: "$Amount" },
          count: { $sum: 1 },
          averageRevenue: { $avg: "$Amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

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

    const formattedData = monthlyRevenue.map((item) => ({
      month: monthNames[item._id.month - 1],
      totalRevenue: item.totalRevenue,
      count: item.count,
      averageRevenue: item.averageRevenue,
    }));

    res.status(200).json({
      year: selectedYear,
      data: formattedData,
      grandTotal: formattedData.reduce((sum, i) => sum + i.totalRevenue, 0),
    });
  } catch (error) {
    console.error("Error in getMonthlyRevenue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get revenue for a specific month
const getMonthRevenue = async (req, res) => {
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
      RevenueDate: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    if (CompanyId) filter.CompanyId = CompanyId;

    const revenues = await Revenue.find(filter)
      .populate("CompanyId", "CompanyName")
      .populate("OrderId", "ServiceTitle OrderStatus TotalAmount")
      .populate("AddedBy", "Name Email")
      .sort({ RevenueDate: -1 });

    const totalAmount = revenues.reduce((sum, rev) => sum + rev.Amount, 0);

    res.status(200).json({
      month: new Date(yearNum, monthNum - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      count: revenues.length,
      totalAmount,
      revenues,
    });
  } catch (error) {
    console.error("Error in getMonthRevenue:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  addRevenue,
  getAllRevenue,
  getRevenueById,
  updateRevenue,
  deleteRevenue,
  getRevenueByOrderId,
  getTotalRevenue,
  getMonthlyRevenue,
  getMonthRevenue,
};
