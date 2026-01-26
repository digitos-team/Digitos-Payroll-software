import React, { useMemo, useState, useEffect } from "react";
import CALayout from "../layouts/CALayout";
import { motion } from "framer-motion";
import { Search, AlertCircle, Loader } from "lucide-react";
import { useSelector } from "react-redux";
import { fetchPayrollHistory } from "../../../utils/CA api/CaApi"; // Make sure fetch function is correct

export default function ViewPayrollData({ deadlines = [] }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { companyId } = useSelector((state) => state.auth);
  const actualCompanyId = companyId?._id || companyId;

  // Load payroll records
  useEffect(() => {
    const loadPayrollData = async () => {
      if (!actualCompanyId) return;
      try {
        setLoading(true);
        setError(null);

        const result = await fetchPayrollHistory({ CompanyId: actualCompanyId });
        setData(result?.data || []);
      } catch (err) {
        setError(err.message || "Failed to load payroll records");
      } finally {
        setLoading(false);
      }
    };

    loadPayrollData();
  }, [actualCompanyId]);

  // Filtering & Searching (by EmployeeName, DepartmentName, Month)
  const filtered = useMemo(() => {
    return data.filter((r) => {
      return query
        ? r.EmployeeName?.toLowerCase().includes(query.toLowerCase()) ||
        r.DepartmentName?.toLowerCase().includes(query.toLowerCase()) ||
        r.Month?.includes(query)
        : true;
    });
  }, [data, query]);

  // Pagination
  const pageCount = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <CALayout deadlines={deadlines}>
      <div className="p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-[#345B87]">Payroll Data</h2>
          <p className="text-sm text-[#4C5A69] mt-1">
            Browse individual payroll records.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mt-6 flex items-center gap-2 border rounded-lg p-2 w-full sm:w-72">
              <Search size={16} className="text-[#6D94C5]" />
              <input
                placeholder="Search name, department, or month"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="outline-none px-2 w-full"
              />
            </div>

            {/* Table */}
            <div className="mt-6 bg-white border border-[#CBDCEB] rounded-xl p-4 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-sm text-[#6D94C5]">
                    <th className="py-2 px-3">Employee Name</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3">Gross Salary</th>
                    <th className="py-2 px-3">Total Deductions</th>
                    <th className="py-2 px-3">Net Salary</th>
                    <th className="py-2 px-3">Tax Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {pageData.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="py-2 px-3">{r.EmployeeName || "N/A"}</td>
                      <td className="py-2 px-3">{r.DepartmentName || "N/A"}</td>
                      <td className="py-2 px-3 text-xs">{r.Month || "N/A"}</td>

                      <td className="py-2 px-3">
                        ₹{(r.grossSalary ?? 0).toLocaleString()}
                      </td>

                      <td className="py-2 px-3">
                        ₹{(r.totalDeductions ?? 0).toLocaleString()}
                      </td>

                      <td className="py-2 px-3 font-semibold">
                        ₹{(r.netSalary ?? 0).toLocaleString()}
                      </td>

                      <td className="py-2 px-3">
                        ₹{(r.TaxAmount ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing{" "}
                {pageData.length > 0 ? (page - 1) * perPage + 1 : 0}-
                {Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="px-3 py-1">
                  {page} / {pageCount || 1}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </CALayout>
  );
}
