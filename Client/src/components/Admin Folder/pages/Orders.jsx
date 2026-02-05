import React, { useEffect, useState } from "react";
import {
  addOrderApi,
  getOrdersApi,
  updateOrderApi,
  confirmOrderApi,
  recordPaymentApi,
  deleteOrderApi,
  getOrderByIdApi,
  getOrderInvoiceApi,
  getFinalBillApi,
  getPaymentHistoryApi,
  getMonthlyOrdersApi,
  getMonthOrdersApi,
  downloadOrdersPDF,
} from "../../../utils/api/orderapi";
import AddOrderModal from "../components/Modals/AddOrderModal";
import RecordPaymentModal from "../components/Modals/RecordPaymentModal";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);

  // Additional states for new features
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthOrders, setMonthOrders] = useState(null);
  const [pdfStartDate, setPdfStartDate] = useState("");
  const [pdfEndDate, setPdfEndDate] = useState("");

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrdersApi();
      setOrders(res || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Add Order
  const handleAddOrder = async (formData) => {
    try {
      await addOrderApi(formData);
      fetchOrders();
      alert("Order added successfully!");
    } catch (err) {
      console.error("Error adding order:", err);
      alert("Failed to add order");
    }
  };

  // Update Order
  const handleUpdateOrder = async (formData) => {
    try {
      // Find the order to check its current status
      const currentOrder = orders.find(o => o._id === formData.id);

      // Prevent updates if order is completed
      if (currentOrder?.OrderStatus === "Completed") {
        alert("Cannot update order: This order is already completed and cannot be modified.");
        return;
      }

      // If payment is fully paid, only allow OrderStatus updates
      if (currentOrder?.PaymentStatus === "Paid") {
        // Check if only OrderStatus is being updated
        const isOnlyStatusUpdate =
          formData.OrderStatus !== currentOrder.OrderStatus &&
          formData.ClientName === currentOrder.ClientName &&
          formData.ServiceTitle === currentOrder.ServiceTitle &&
          formData.BaseAmount === currentOrder.BaseAmount;

        if (!isOnlyStatusUpdate) {
          alert("Cannot update order details: This order is fully paid. You can only update the order status.");
          return;
        }

        // Only send OrderStatus update
        await updateOrderApi({ id: formData.id, OrderStatus: formData.OrderStatus });
        fetchOrders();
        alert("Order status updated successfully!");
        return;
      }

      await updateOrderApi(formData);
      fetchOrders();
      alert("Order updated successfully!");
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order");
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order? This will also delete related revenue records.")) {
      return;
    }
    try {
      await deleteOrderApi(orderId);
      fetchOrders();
      alert("Order deleted successfully!");
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to delete order");
    }
  };

  // Confirm Order (with payment)
  const handleConfirmOrder = (order) => {
    setSelectedOrder(order);
    setIsConfirmingOrder(true);
    setPaymentModalOpen(true);
  };

  // Record Payment
  const handleRecordPayment = (order) => {
    setSelectedOrder(order);
    setIsConfirmingOrder(false);
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (paymentData) => {
    try {
      if (isConfirmingOrder) {
        await confirmOrderApi(selectedOrder._id, paymentData);
        alert("Order confirmed successfully!");
      } else {
        await recordPaymentApi(selectedOrder._id, paymentData);
        alert("Payment recorded successfully!");
      }
      fetchOrders();
    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment");
    }
  };

  // Get Order Details
  const handleViewOrderDetails = async (orderId) => {
    try {
      const res = await getOrderByIdApi(orderId);
      setOrderDetails(res);

    } catch (err) {
      console.error("Error fetching order details:", err);
      alert("Failed to fetch order details");
    }
  };

  // Get Payment History
  const handleViewPaymentHistory = async (orderId) => {
    try {
      const res = await getPaymentHistoryApi(orderId);
      setPaymentHistory(res);

    } catch (err) {
      console.error("Error fetching payment history:", err);
      alert("Failed to fetch payment history");
    }
  };

  // Download Proforma Invoice
  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await getOrderInvoiceApi(orderId);
      const file = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Proforma-Invoice-${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice");
    }
  };

  // Download Final Bill
  const handleDownloadFinalBill = async (orderId) => {
    try {
      const res = await getFinalBillApi(orderId);
      const file = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Tax-Invoice-${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading final bill:", error);
      alert("Failed to download final bill. Make sure the order is fully paid.");
    }
  };

  // Get Monthly Stats
  const handleGetMonthlyStats = async () => {
    try {
      const res = await getMonthlyOrdersApi(selectedYear);
      setMonthlyStats(res);

    } catch (err) {
      console.error("Error fetching monthly stats:", err);
      alert("Failed to fetch monthly stats");
    }
  };

  // Get Month Orders
  const handleGetMonthOrders = async () => {
    try {
      const res = await getMonthOrdersApi(selectedMonth, selectedYear);
      setMonthOrders(res);

    } catch (err) {
      console.error("Error fetching month orders:", err);
      alert("Failed to fetch month orders");
    }
  };

  // Get Payment Status Badge
  const getPaymentStatusBadge = (status) => {
    const styles = {
      Pending: "bg-red-100 text-red-700",
      "Partially Paid": "bg-yellow-100 text-yellow-700",
      Paid: "bg-green-100 text-green-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  // Get Order Status Badge
  const getOrderStatusBadge = (status) => {
    const styles = {
      Pending: "bg-gray-100 text-gray-700",
      Confirmed: "bg-blue-100 text-blue-700",
      "In Progress": "bg-yellow-100 text-yellow-700",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-5">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-semibold">Orders Management</h2>
          <p className="text-sm text-gray-500">Manage client orders and track payments</p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Order
        </button>
      </div>

      {/* ORDERS TABLE WITH HORIZONTAL SCROLL */}
      {loading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
          <table className="w-full border-collapse min-w-max">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left whitespace-nowrap">Order #</th>
                <th className="p-3 border text-left whitespace-nowrap">Client</th>
                <th className="p-3 border text-left whitespace-nowrap">GSTIN</th>
                <th className="p-3 border text-left whitespace-nowrap">State</th>
                <th className="p-3 border text-left whitespace-nowrap">Service</th>
                <th className="p-3 border text-right whitespace-nowrap">Base Amt</th>
                <th className="p-3 border text-center whitespace-nowrap">GST Type</th>
                <th className="p-3 border text-right whitespace-nowrap">GST</th>
                <th className="p-3 border text-right whitespace-nowrap">Total</th>
                <th className="p-3 border text-right whitespace-nowrap">Paid</th>
                <th className="p-3 border text-right whitespace-nowrap">Balance</th>
                <th className="p-3 border text-center whitespace-nowrap">Payment</th>
                <th className="p-3 border text-center whitespace-nowrap">Status</th>
                <th className="p-3 border text-left whitespace-nowrap">Invoice #</th>
                <th className="p-3 border text-center whitespace-nowrap">Start</th>
                <th className="p-3 border text-center whitespace-nowrap">End</th>
                <th className="p-3 border text-center whitespace-nowrap" style={{ minWidth: "450px" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={17} className="text-center p-4 text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {/* Order Number */}
                    <td className="border p-2 whitespace-nowrap">
                      <div className="text-xs font-mono text-blue-600">{o.OrderNumber || "-"}</div>
                    </td>

                    {/* Client Info */}
                    <td className="border p-2 whitespace-nowrap">
                      <div className="font-medium">{o.ClientName}</div>
                      <div className="text-xs text-gray-500">{o.ClientEmail}</div>
                    </td>

                    {/* GSTIN */}
                    <td className="border p-2 text-xs whitespace-nowrap" title={o.ClientGSTIN || "No GSTIN"}>
                      {o.ClientGSTIN ? `${o.ClientGSTIN.substring(0, 10)}...` : "-"}
                    </td>

                    {/* State with Inter-State Indicator */}
                    <td className="border p-2 text-xs whitespace-nowrap">
                      <div>{o.ClientState || "-"}</div>
                      {o.IsIGST && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded" title="Inter-State Transaction">
                          🌍 IGST
                        </span>
                      )}
                    </td>

                    {/* Service */}
                    <td className="border p-2 whitespace-nowrap">{o.ServiceTitle}</td>

                    {/* Base Amount */}
                    <td className="border p-2 text-right whitespace-nowrap">₹{o.BaseAmount?.toLocaleString()}</td>

                    {/* GST Type Badge */}
                    <td className="border p-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${o.GSTType === 'IGST'
                        ? 'bg-purple-100 text-purple-700'
                        : o.GSTType === 'CGST+SGST'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {o.GSTType || 'N/A'}
                      </span>
                    </td>

                    {/* GST Amount */}
                    <td className="border p-2 text-right text-blue-600 whitespace-nowrap" title={`${o.GSTType || 'GST'}: ₹${o.TotalGSTAmount?.toFixed(2)}`}>
                      ₹{o.TotalGSTAmount?.toLocaleString()}
                      <div className="text-xs text-gray-500">({o.GSTRate}%)</div>
                    </td>

                    {/* Total Amount */}
                    <td className="border p-2 text-right font-semibold whitespace-nowrap">₹{o.Amount?.toLocaleString()}</td>

                    {/* Paid */}
                    <td className="border p-2 text-right text-green-600 whitespace-nowrap">₹{o.AdvancePaid?.toLocaleString()}</td>

                    {/* Balance */}
                    <td className="border p-2 text-right text-red-600 whitespace-nowrap">₹{o.BalanceDue?.toLocaleString()}</td>

                    {/* Payment Status */}
                    <td className="border p-2 text-center whitespace-nowrap">{getPaymentStatusBadge(o.PaymentStatus)}</td>

                    {/* Order Status */}
                    <td className="border p-2 text-center whitespace-nowrap">{getOrderStatusBadge(o.OrderStatus)}</td>

                    {/* Tax Invoice Number */}
                    <td className="border p-2 whitespace-nowrap">
                      {o.TaxInvoiceNumber ? (
                        <div className="text-xs font-mono text-green-600" title="Tax Invoice Generated">
                          {o.TaxInvoiceNumber}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="border p-2 text-center text-sm whitespace-nowrap">
                      {o.StartDate ? new Date(o.StartDate).toLocaleDateString() : "-"}
                    </td>

                    {/* End Date */}
                    <td className="border p-2 text-center text-sm whitespace-nowrap">
                      {o.EndDate ? new Date(o.EndDate).toLocaleDateString() : "-"}
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="border p-2">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewOrderDetails(o._id)}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition whitespace-nowrap"
                          title="View Details"
                        >
                          Details
                        </button>

                        {/* Update Button */}
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setEditModalOpen(true);
                          }}
                          className={`px-2 py-1 rounded text-xs transition whitespace-nowrap ${o.OrderStatus === "Completed"
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"
                            }`}
                          title={
                            o.OrderStatus === "Completed"
                              ? "Cannot update completed orders"
                              : "Update Order"
                          }
                          disabled={o.OrderStatus === "Completed"}
                        >
                          Update
                        </button>

                        {/* Confirm Order Button (only for Pending) */}
                        {o.OrderStatus === "Pending" && (
                          <button
                            onClick={() => handleConfirmOrder(o)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition whitespace-nowrap"
                            title="Confirm Order"
                          >
                            Confirm
                          </button>
                        )}

                        {/* Record Payment Button (only for Confirmed/Partially Paid) */}
                        {o.OrderStatus !== "Pending" && o.PaymentStatus !== "Paid" && (
                          <button
                            onClick={() => handleRecordPayment(o)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition whitespace-nowrap"
                            title="Record Payment"
                          >
                            Payment
                          </button>
                        )}

                        {/* Payment History */}
                        <button
                          onClick={() => handleViewPaymentHistory(o._id)}
                          className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 transition whitespace-nowrap"
                          title="Payment History"
                        >
                          History
                        </button>

                        {/* Proforma Invoice */}
                        <button
                          onClick={() => handleDownloadInvoice(o._id)}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition whitespace-nowrap"
                          title="Download Proforma Invoice"
                        >
                          Proforma
                        </button>

                        {/* Tax Invoice (only when fully paid) */}
                        {o.PaymentStatus === "Paid" && (
                          <button
                            onClick={() => handleDownloadFinalBill(o._id)}
                            className="bg-green-700 text-white px-2 py-1 rounded text-xs hover:bg-green-800 transition whitespace-nowrap"
                            title="Download Tax Invoice"
                          >
                            Tax Invoice
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteOrder(o._id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition whitespace-nowrap"
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADDITIONAL FEATURES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Monthly Statistics */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Monthly Statistics</h3>
          <div className="flex gap-3 mb-4">
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="Year"
              className="border p-2 rounded-lg flex-1"
            />
            <button
              onClick={handleGetMonthlyStats}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Stats
            </button>
          </div>
          {monthlyStats && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold mb-2">Summary for {monthlyStats.year}</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-semibold">{monthlyStats.summary?.totalOrdersInYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-semibold">₹{monthlyStats.summary?.grandTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-semibold">{monthlyStats.summary?.totalCompletedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span className="font-semibold">{monthlyStats.summary?.totalPaidOrders}</span>
                  </div>
                </div>
              </div>
              {monthlyStats.data?.map((month) => (
                <div key={month.monthNumber} className="border p-2 rounded text-sm">
                  <div className="font-medium">{month.month}</div>
                  <div className="text-xs text-gray-600">
                    Orders: {month.totalOrders} | Value: ₹{month.totalOrderValue?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Specific Month Orders */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold mb-4">Month Orders</h3>
          <div className="flex gap-3 mb-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-2 rounded-lg flex-1"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="Year"
              className="border p-2 rounded-lg w-24"
            />
            <button
              onClick={handleGetMonthOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Orders
            </button>
          </div>
          {monthOrders && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold mb-2">{monthOrders.month}</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-semibold">{monthOrders.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-semibold">₹{monthOrders.totalValue?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {monthOrders.orders?.map((order) => (
                <div key={order._id} className="border p-2 rounded text-sm">
                  <div className="font-medium">{order.ClientName}</div>
                  <div className="text-xs text-gray-600">
                    {order.ServiceTitle} | ₹{order.Amount?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Display */}
      {orderDetails && (
        <div className="bg-white rounded-lg shadow p-5 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <button
              onClick={() => setOrderDetails(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Order Numbers Section */}
          <div className="bg-gray-50 p-3 rounded mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Order Number:</span>
                <span className="ml-2 font-mono font-semibold text-blue-600">
                  {orderDetails.order?.OrderNumber || "N/A"}
                </span>
              </div>
              {orderDetails.order?.TaxInvoiceNumber && (
                <div>
                  <span className="text-gray-600">Tax Invoice Number:</span>
                  <span className="ml-2 font-mono font-semibold text-green-600">
                    {orderDetails.order.TaxInvoiceNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Information */}
            <div>
              <h4 className="font-medium mb-2">Client Information</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-600">Name:</span> {orderDetails.order?.ClientName}</div>
                <div><span className="text-gray-600">Email:</span> {orderDetails.order?.ClientEmail || "N/A"}</div>
                <div><span className="text-gray-600">Phone:</span> {orderDetails.order?.ClientPhone || "N/A"}</div>
                <div><span className="text-gray-600">GSTIN:</span> {orderDetails.order?.ClientGSTIN || "N/A"}</div>
                <div><span className="text-gray-600">State:</span> {orderDetails.order?.ClientState || "N/A"}</div>

                {/* Client Address */}
                {orderDetails.order?.ClientAddress && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-medium text-gray-700 mb-1">Address:</div>
                    <div className="text-sm dropdown-item whitespace-pre-wrap">{orderDetails.order.ClientAddress}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Service & GST Information */}
            <div>
              <h4 className="font-medium mb-2">Service & GST Details</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-600">Service:</span> {orderDetails.order?.ServiceTitle}</div>
                <div><span className="text-gray-600">HSN Code:</span> {orderDetails.order?.HSNCode || "N/A"}</div>
                <div><span className="text-gray-600">Status:</span> {orderDetails.order?.OrderStatus}</div>

                <div className="mt-2 pt-2 border-t">
                  <div className="font-medium text-gray-700 mb-1">GST Breakdown:</div>
                  <div><span className="text-gray-600">Base Amount:</span> ₹{orderDetails.order?.BaseAmount?.toLocaleString()}</div>
                  <div><span className="text-gray-600">GST Rate:</span> {orderDetails.order?.GSTRate}%</div>

                  {/* GST Type Badge */}
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${orderDetails.order?.GSTType === 'IGST'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {orderDetails.order?.IsIGST ? '🌍 Inter-State (IGST)' : '🏠 Intra-State (CGST+SGST)'}
                    </span>
                  </div>

                  {/* GST Amounts */}
                  {orderDetails.order?.GSTType === "IGST" ? (
                    <div className="mt-1"><span className="text-gray-600">IGST:</span> ₹{orderDetails.order?.IGSTAmount?.toFixed(2)}</div>
                  ) : (
                    <>
                      <div className="mt-1"><span className="text-gray-600">CGST:</span> ₹{orderDetails.order?.CGSTAmount?.toFixed(2)}</div>
                      <div><span className="text-gray-600">SGST:</span> ₹{orderDetails.order?.SGSTAmount?.toFixed(2)}</div>
                    </>
                  )}
                  <div><span className="text-gray-600">Total GST:</span> ₹{orderDetails.order?.TotalGSTAmount?.toFixed(2)}</div>
                  <div className="font-semibold mt-1"><span className="text-gray-600">Final Amount:</span> ₹{orderDetails.order?.Amount?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div>
              <h4 className="font-medium mb-2">Financial Summary</h4>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-600">Total Amount:</span> ₹{orderDetails.order?.Amount?.toLocaleString()}</div>
                <div><span className="text-gray-600">Paid:</span> <span className="text-green-600 font-semibold">₹{orderDetails.order?.AdvancePaid?.toLocaleString()}</span></div>
                <div><span className="text-gray-600">Balance:</span> <span className="text-red-600 font-semibold">₹{orderDetails.order?.BalanceDue?.toLocaleString()}</span></div>
                <div><span className="text-gray-600">Payment Status:</span> {orderDetails.order?.PaymentStatus}</div>

                <div className="mt-2 pt-2 border-t">
                  <div className="font-medium text-gray-700 mb-1">Project Financials:</div>
                  <div><span className="text-gray-600">Total Expenses:</span> ₹{orderDetails.summary?.totalExpenses?.toLocaleString()}</div>
                  <div><span className="text-gray-600">Total Revenue:</span> ₹{orderDetails.summary?.totalRevenue?.toLocaleString()}</div>
                  <div className="font-semibold"><span className="text-gray-600">Estimated Profit:</span> ₹{orderDetails.summary?.estimatedProfit?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Display */}
      {paymentHistory && (
        <div className="bg-white rounded-lg shadow p-5 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <button
              onClick={() => setPaymentHistory(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="mb-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">₹{paymentHistory.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-semibold text-green-600">₹{paymentHistory.totalPaid?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Due:</span>
                <span className="font-semibold text-red-600">₹{paymentHistory.balanceDue?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {paymentHistory.paymentHistory?.map((payment, index) => (
              <div key={index} className="border p-3 rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">₹{payment.amount?.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Method: {payment.paymentMethod} | {payment.notes || "No notes"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD ORDER MODAL */}
      <AddOrderModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onAdd={handleAddOrder}
        mode="add"
      />

      {/* EDIT ORDER MODAL */}
      <AddOrderModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedOrder(null);
        }}
        onUpdate={handleUpdateOrder}
        mode="edit"
        defaultValues={selectedOrder}
        isPaid={selectedOrder?.PaymentStatus === "Paid"}
      />

      {/* RECORD PAYMENT MODAL */}
      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedOrder(null);
          setIsConfirmingOrder(false);
        }}
        onRecord={handleSubmitPayment}
        order={selectedOrder}
        isConfirmation={isConfirmingOrder}
      />
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Export Orders Report</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={pdfStartDate}
              onChange={(e) => setPdfStartDate(e.target.value)}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={pdfEndDate}
              onChange={(e) => setPdfEndDate(e.target.value)}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() =>
              downloadOrdersPDF({
                startDate: pdfStartDate,
                endDate: pdfEndDate,
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

    </div>
  );
};

export default Orders;
