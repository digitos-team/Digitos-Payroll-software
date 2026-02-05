import React, { useState, useEffect } from "react";
import { INDIAN_STATES, GST_RATES, HSN_CODES } from "../../constants/indianStates";
import {
  validateGSTIN,
  getStateFromGSTIN,
  formatGSTIN,
  calculateGST,
  isInterState
} from "../../../../utils/gstValidator";

const AddOrderModal = ({ open, onClose, onAdd, onUpdate, mode = "add", defaultValues = null, isPaid = false }) => {
  const [form, setForm] = useState({
    clientName: "",
    email: "",
    phone: "",
    clientGSTIN: "",
    clientState: "",
    clientAddress: "",
    serviceTitle: "",
    description: "",
    hsnCode: "998314",
    startDate: "",
    endDate: "",
    baseAmount: "",
    gstRate: 18,
    orderStatus: "Pending",
  });

  const [gstinError, setGstinError] = useState("");
  const [gstCalculation, setGstCalculation] = useState({
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalGST: 0,
    totalAmount: 0,
    gstType: "CGST+SGST"
  });

  // Calculate GST whenever baseAmount, gstRate, or clientState changes
  useEffect(() => {
    if (form.baseAmount && form.gstRate !== undefined) {
      // For now, we'll assume intra-state (CGST+SGST) in the preview
      // The backend will determine the actual type based on company state
      const isIGST = false; // This will be determined by backend
      const calculation = calculateGST(form.baseAmount, form.gstRate, isIGST);
      setGstCalculation(calculation);
    }
  }, [form.baseAmount, form.gstRate, form.clientState]);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && defaultValues) {
      setForm({
        clientName: defaultValues.ClientName || "",
        email: defaultValues.ClientEmail || "",
        phone: defaultValues.ClientPhone || "",
        clientGSTIN: defaultValues.ClientGSTIN || "",
        clientState: defaultValues.ClientState || "",
        clientAddress: defaultValues.ClientAddress || "",
        serviceTitle: defaultValues.ServiceTitle || "",
        description: defaultValues.ServiceDescription || "",
        hsnCode: defaultValues.HSNCode || "998314",
        startDate: defaultValues.StartDate ? new Date(defaultValues.StartDate).toISOString().slice(0, 10) : "",
        endDate: defaultValues.EndDate ? new Date(defaultValues.EndDate).toISOString().slice(0, 10) : "",
        baseAmount: defaultValues.BaseAmount || "",
        gstRate: defaultValues.GSTRate || 18,
        orderStatus: defaultValues.OrderStatus || "Pending",
      });
    }
  }, [mode, defaultValues, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleGSTINChange = (e) => {
    const gstin = formatGSTIN(e.target.value);
    setForm({ ...form, clientGSTIN: gstin });

    // Validate GSTIN
    const validation = validateGSTIN(gstin);
    setGstinError(validation.valid ? "" : validation.message);

    // Auto-populate state from GSTIN if valid
    if (validation.valid && gstin) {
      const state = getStateFromGSTIN(gstin);
      if (state) {
        setForm(prev => ({ ...prev, clientState: state }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate GSTIN before submission
    if (form.clientGSTIN) {
      const validation = validateGSTIN(form.clientGSTIN);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
    }

    const orderData = {
      ClientName: form.clientName,
      ClientEmail: form.email,
      ClientPhone: form.phone,
      ClientGSTIN: form.clientGSTIN || undefined,
      ClientState: form.clientState || undefined,
      ClientAddress: form.clientAddress || undefined,
      ServiceTitle: form.serviceTitle,
      ServiceDescription: form.description,
      HSNCode: form.hsnCode,
      StartDate: form.startDate,
      EndDate: form.endDate,
      BaseAmount: Number(form.baseAmount),
      GSTRate: Number(form.gstRate),
      OrderStatus: form.orderStatus,
    };

    if (mode === "edit") {
      onUpdate({ ...orderData, id: defaultValues._id });
    } else {
      onAdd(orderData);
    }

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      clientName: "",
      email: "",
      phone: "",
      clientGSTIN: "",
      clientState: "",
      clientAddress: "",
      serviceTitle: "",
      description: "",
      hsnCode: "998314",
      startDate: "",
      endDate: "",
      baseAmount: "",
      gstRate: 18,
      orderStatus: "Pending",
    });
    setGstinError("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl my-8">
        <h2 className="text-xl font-semibold mb-4">
          {mode === "edit" ? "Update Order" : "Add New Order"}
        </h2>

        {isPaid && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This order is fully paid. Only the Order Status can be updated.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Client Information */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="Client Name *"
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={isPaid}
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                disabled={isPaid}
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                disabled={isPaid}
              />
            </div>
            <div className="mt-3">
              <textarea
                name="clientAddress"
                value={form.clientAddress}
                onChange={handleChange}
                placeholder="Address"
                className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                rows={2}
                disabled={isPaid}
              />
            </div>
          </div>

          {/* GST Information */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">GST Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  name="clientGSTIN"
                  value={form.clientGSTIN}
                  onChange={handleGSTINChange}
                  placeholder="GSTIN (e.g., 22AAAAA0000A1Z5)"
                  maxLength={15}
                  className={`border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${gstinError ? "border-red-500" : ""
                    }`}
                  disabled={isPaid}
                />
                {gstinError && (
                  <p className="text-xs text-red-500 mt-1">{gstinError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 char + Z + 1 char
                </p>
              </div>
              <select
                name="clientState"
                value={form.clientState}
                onChange={handleChange}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                disabled={isPaid}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>


          {/* Service Details */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                name="serviceTitle"
                value={form.serviceTitle}
                onChange={handleChange}
                placeholder="Service Title *"
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={isPaid}
              />
              <select
                name="hsnCode"
                value={form.hsnCode}
                onChange={handleChange}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                disabled={isPaid}
              >
                {HSN_CODES.map((hsn) => (
                  <option key={hsn.value} value={hsn.value}>
                    {hsn.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Service Description"
              className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
              rows={3}
              disabled={isPaid}
            />
          </div>

          {/* Timeline */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isPaid}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">End Date</label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isPaid}
                />
              </div>
            </div>
          </div>

          {/* Order Status */}
          {mode === "edit" && (
            <div className="border-b pb-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Status</h3>
              <select
                name="orderStatus"
                value={form.orderStatus}
                onChange={handleChange}
                className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Financial Details with GST */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-600">Base Amount (Before GST) *</label>
                <input
                  name="baseAmount"
                  type="number"
                  value={form.baseAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  min="0"
                  step="0.01"
                  required
                  disabled={isPaid}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">GST Rate *</label>
                <select
                  name="gstRate"
                  value={form.gstRate}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isPaid}
                >
                  {GST_RATES.map((rate) => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* GST Calculation Preview */}
            {form.baseAmount > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">GST Calculation Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Base Amount:</span>
                    <div className="font-semibold">₹{parseFloat(form.baseAmount).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">CGST ({form.gstRate / 2}%):</span>
                    <div className="font-semibold">₹{gstCalculation.cgst.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">SGST ({form.gstRate / 2}%):</span>
                    <div className="font-semibold">₹{gstCalculation.sgst.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total GST:</span>
                    <div className="font-semibold text-blue-700">₹{gstCalculation.totalGST.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <span className="text-gray-600 text-xs">Final Amount (incl. GST):</span>
                  <div className="font-bold text-lg text-blue-900">₹{gstCalculation.totalAmount.toLocaleString()}</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Final GST type (CGST+SGST or IGST) will be determined by the backend based on state comparison
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="bg-gray-300 px-5 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
              disabled={!!gstinError}
            >
              {mode === "edit" ? "Update Order" : "Add Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
