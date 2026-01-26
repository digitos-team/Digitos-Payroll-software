import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";

import RevenueModal from "../components/Modals/RevenueModal";
import { getAllOrdersApi } from "../../../utils/api/orderapi";

import {
  addRevenue,
  getAllRevenue,
  deleteRevenue,
  getTotalRevenue,
  getMonthRevenue,
  getRevenueWithProfitByOrder,
} from "../../../utils/api/revenueapi";

const Revenue = () => {
  const [openModal, setOpenModal] = useState(false);
  const [revenueList, setRevenueList] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(null);

  // Orders for dropdown
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [profitData, setProfitData] = useState(null);



  // 📅 Month/Year Filter
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [filteredRevenues, setFilteredRevenues] = useState([]);



  const fetchRevenue = async () => {
    try {
      const data = await getAllRevenue();
      setRevenueList(data);
    } catch (err) {
      console.error("Error fetching revenue:", err);
    }
  };

  const handleAddRevenue = async (data) => {
    try {
      const res = await addRevenue(data);
      setRevenueList((prev) => [res.revenue, ...prev]);
      setOpenModal(false);
      fetchTotalRevenue();
    } catch (err) {
      console.error("Error adding revenue:", err);
    }
  };

  const handleDeleteRevenue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this revenue?")) return;

    try {
      await deleteRevenue(id);
      alert("Revenue deleted successfully");
      fetchRevenue();
      fetchTotalRevenue();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete revenue.");
    }
  };

  const fetchTotalRevenue = async () => {
    try {
      const data = await getTotalRevenue();
      setTotalRevenue(data.totalRevenue);
    } catch (err) {
      console.error("Error loading total revenue:", err);
    }
  };



  const fetchMonthRevenue = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const data = await getMonthRevenue(month, year);
      setMonthRevenue(data);
    } catch (error) {
      console.error("Error loading monthly revenue:", error);
    }
  };

  // 📅 Fetch revenue by selected month/year
  const handleFetchMonthlyRevenue = async () => {
    try {
      const data = await getMonthRevenue(selectedMonth, selectedYear);
      setFilteredRevenues(data.revenues || []);
      setMonthRevenue(data);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      alert("Failed to fetch revenue for selected month");
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await getAllOrdersApi();
      const ordersList = Array.isArray(data) ? data : (data?.orders || []);
      setOrders(ordersList);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
  };

  const handleFetchProfit = async () => {
    if (!selectedOrderId) {
      alert("Please select an order");
      return;
    }

    try {
      const data = await getRevenueWithProfitByOrder(selectedOrderId);
      setProfitData(data);
    } catch (error) {
      alert("Error fetching profit details");
    }
  };

  useEffect(() => {
    fetchRevenue();
    fetchTotalRevenue();
    fetchMonthRevenue();
    fetchOrders();
  }, []);

  return (
    <div className="p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-gray-100">Revenue List</h2>
        <Button variant="contained" onClick={() => setOpenModal(true)}>
          Add Revenue
        </Button>
      </div>

      {/* MONTH/YEAR FILTER */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Filter Revenue by Month</h3>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border px-3 py-2 rounded w-40"
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border px-3 py-2 rounded w-32"
            >
              {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFetchMonthlyRevenue}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Filter Revenue
          </button>

          {filteredRevenues.length > 0 && (
            <button
              onClick={() => setFilteredRevenues([])}
              className="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* MONTH SUMMARY */}
      {monthRevenue && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border dark:border-green-800 rounded dark:text-gray-100">
          <h3 className="text-lg font-bold">Revenue for {monthRevenue.month}</h3>
          <p>Total Revenue: ₹{monthRevenue.totalAmount}</p>
          <p>Total Records: {monthRevenue.count}</p>
        </div>
      )}

      {/* ORDER DROPDOWN FOR PROFIT */}
      <div className="mb-4 p-4 bg-gray-50 border rounded flex items-center gap-4">
        <select
          className="border px-3 py-2 rounded w-72"
          value={selectedOrderId}
          onChange={(e) => {
            setSelectedOrderId(e.target.value);
            setProfitData(null);
          }}
        >
          <option value="">-- Select Order for Profit --</option>
          {orders.map((order) => (
            <option key={order._id} value={order._id}>
              {order.ServiceTitle} — ₹{order.Amount}
            </option>
          ))}
        </select>

        <button
          onClick={handleFetchProfit}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Get Profit
        </button>
      </div>

      {/* PROFIT SECTION */}
      {profitData && (
        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 border dark:border-yellow-800 rounded shadow dark:text-gray-100">
          <h3 className="text-lg font-semibold mb-2">
            Profit Report
          </h3>

          <p><strong>Total Revenue:</strong> ₹{profitData.totalRevenue}</p>
          <p><strong>Total Expense:</strong> ₹{profitData.totalExpense}</p>
          <p className="font-bold"><strong>Profit:</strong> ₹{profitData.profit}</p>

          <h4 className="mt-3 font-semibold">Revenue Breakdown:</h4>
          <ul className="list-disc ml-6">
            {profitData.revenue.map((item) => (
              <li key={item._id}>{item.Source} — ₹{item.Amount}</li>
            ))}
          </ul>
        </div>
      )}





      {/* FILTERED REVENUE RESULTS */}
      {filteredRevenues.length > 0 && (
        <div className="mt-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">
            Revenue for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <table className="table-auto w-full border">
            <thead>
              <tr className="bg-blue-100 dark:bg-blue-900 dark:text-gray-100">
                <th className="p-2 border">Source</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Revenue Date</th>
                <th className="p-2 border">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredRevenues.map((item) => (
                <tr key={item._id} className="dark:text-gray-200">
                  <td className="p-2 border">{item.Source}</td>
                  <td className="p-2 border">₹{item.Amount}</td>
                  <td className="p-2 border">{new Date(item.RevenueDate).toLocaleDateString()}</td>
                  <td className="p-2 border">{item.Description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/50 border dark:border-blue-800 rounded dark:text-gray-200">
            <p className="font-semibold">Total: ₹{filteredRevenues.reduce((sum, item) => sum + item.Amount, 0)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Records: {filteredRevenues.length}</p>
          </div>
        </div>
      )}

      {/* MAIN REVENUE TABLE */}
      <table className="table-auto w-full border mt-4">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100">
            <th className="p-2 border">Source</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Revenue Date</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {revenueList.map((item) => (
            <tr key={item._id} className="dark:text-gray-200">
              <td className="p-2 border">{item.Source}</td>
              <td className="p-2 border">₹{item.Amount}</td>
              <td className="p-2 border">{new Date(item.RevenueDate).toLocaleDateString()}</td>
              <td className="p-2 border">{item.Description || "-"}</td>

              <td className="p-2 border text-center">
                <button
                  onClick={() => handleDeleteRevenue(item._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 border dark:border-blue-800 rounded dark:text-gray-100">
        <h3 className="text-lg font-bold">Total Revenue: ₹{Math.round(totalRevenue)}</h3>
      </div>

      {/* MODAL */}
      <RevenueModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onAdd={handleAddRevenue}
      />
    </div>
  );
};

export default Revenue;