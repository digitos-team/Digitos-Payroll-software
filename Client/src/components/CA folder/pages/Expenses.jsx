import React, { useEffect, useState } from "react";
import CALayout from "../layouts/CALayout";
import Loader from "../Loader/Loader";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { getAllExpenses } from "../../../utils/CA api/CaApi";
import { BASE_URL } from "../../../utils/config";

// Base URL for accessing uploaded files (without /api)

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = expenses.filter((item) => {
    const matchesSearch =
      item.ExpenseTitle.toLowerCase().includes(search.toLowerCase());

    const matchesPayment =
      paymentMethod === "" || item.PaymentMethod === paymentMethod;

    const matchesDateFrom =
      !dateFrom || new Date(item.ExpenseDate) >= new Date(dateFrom);

    const matchesDateTo =
      !dateTo || new Date(item.ExpenseDate) <= new Date(dateTo);

    return matchesSearch && matchesPayment && matchesDateFrom && matchesDateTo;
  });

  if (loading) return <Loader />;

  if (error) {
    return (
      <CALayout deadlines={[]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Expenses
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </CALayout>
    );
  }

  return (
    <CALayout deadlines={[]}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Expenses</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <input
            type="text"
            placeholder="Search Expense Title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* Payment Method */}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredData.length === 0 ? (
            <p className="text-center py-6">No expenses found.</p>
          ) : (
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-3 text-left">Title</th>
                  <th className="border p-3 text-left">Amount</th>
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Payment</th>
                  <th className="border p-3 text-left">Order (If Any)</th>
                  <th className="border p-3 text-left">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((exp) => (
                  <tr key={exp._id} className="hover:bg-gray-50">
                    <td className="border p-3">{exp.ExpenseTitle}</td>

                    <td className="border p-3 font-semibold text-green-700">
                      ₹ {exp.Amount}
                    </td>

                    <td className="border p-3">
                      {format(new Date(exp.ExpenseDate), "dd-MM-yyyy")}
                    </td>

                    <td className="border p-3">{exp.PaymentMethod}</td>

                    <td className="border p-3">
                      {exp.OrderId ? exp.OrderId.ServiceTitle : "—"}
                    </td>

                    <td className="border p-3 text-blue-600 underline cursor-pointer">
                      {exp.Receipt ? (
                        <a href={`${BASE_URL}${exp.Receipt}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </CALayout>
  );
};

export default Expenses;