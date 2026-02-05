// 
import React, { useState, useEffect } from "react";
import QuickActionCard from "../components/QuickActionCard/QuickActionCard";
import PayrollTrends from "../components/Charts/PayrollTrends";


import SalaryPayable from "../components/Finance/SalaryPayable";
import { CreditCard, DollarSign, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExpenseModal from "../components/Modals/ExpenseModal";
import RevenueModal from "../components/Modals/RevenueModal";
import AddOrderModal from "../components/Modals/AddOrderModal";
import { useBranches } from "../context/BranchContext";
import TaxSlab from "./TaxSlab";
import AddTaxSlabModal from "../components/Modals/AddTaxSlabModal";
import { fetchTaxSlabs, addTaxSlab } from "../../../utils/api/taxslabapi";
import { addRevenue as addRevenueApi } from "../../../utils/api/revenueapi";

export default function Finance() {
  const navigate = useNavigate();
  const { branches = [], addExpense, addRevenue, orders = [] } = useBranches();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTaxSlabPage, setShowTaxSlabPage] = useState(false);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [taxSlabs, setTaxSlabs] = useState([]);

  const [orderList, setOrderList] = useState([]);

  const handleAddOrder = (data) => {
    setOrderList((prev) => [{ id: Date.now(), ...data }, ...prev]);
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTaxSlabs();
        const slabs = Array.isArray(data)
          ? data
          : data?.taxSlabs || data?.data || [];
        setTaxSlabs(slabs);
      } catch (err) {
        console.error("Failed to load tax slabs:", err);
      }
    }
    if (showTaxSlabPage) load();
  }, [showTaxSlabPage]);

  const handleAddTaxSlab = async (slab) => {
    try {
      await addTaxSlab(slab);
      const data = await fetchTaxSlabs();
      const slabs = Array.isArray(data)
        ? data
        : data?.taxSlabs || data?.data || [];
      setTaxSlabs(slabs);
      setShowAddTaxModal(false);
    } catch (err) {
      console.error("Error adding tax slab:", err);
      alert("Failed to add tax slab. See console for details.");
    }
  };

  const handleAddRevenue = async (data) => {
    try {
      await addRevenueApi(data);
      alert("Revenue added successfully!");
    } catch (err) {
      console.error("Failed to add revenue:", err);
      alert("Failed to add revenue. Check console for details.");
    }
  };

  const quicks = [
    {
      title: "Manage Tax Slabs",
      desc: "Adjust tax configurations",
      Icon: CreditCard,
      color: "bg-yellow-500",
      onClick: () => setShowTaxSlabPage(true),
    },
    {
      title: "Manage Revenue",
      desc: "Open revenue management",
      Icon: DollarSign,
      color: "bg-green-500",
      onClick: () => navigate("/revenue"),
    },
    {
      title: "Manage Expense",
      desc: "Track and manage expenses",
      Icon: CreditCard,
      color: "bg-red-500",
      onClick: () => navigate("/expenses"),
    },
    {
      title: "Add Order",
      desc: "Create new client order",
      Icon: FileText,
      color: "bg-blue-500",
      onClick: () => navigate("/orders"),
    },
    {
      title: "Manage Sales",
      desc: "View and manage sales",
      Icon: DollarSign,
      color: "bg-emerald-500",
      onClick: () => navigate("/manage-sales"),
    },
  ];

  return (
    <div className="space-y-6">
      {showTaxSlabPage ? (
        <TaxSlab slabs={taxSlabs} onAddClick={() => setShowAddTaxModal(true)} />
      ) : (
        <>
          {/* Header */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800">Finance</h2>
            <p className="text-sm text-gray-500">
              Financial operations and reports
            </p>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Finance Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quicks.map((q) => (
                <QuickActionCard
                  key={q.title}
                  title={q.title}
                  desc={q.desc}
                  Icon={q.Icon}
                  color={q.color}
                  onClick={q.onClick}
                />
              ))}
            </div>
          </section>

          {/* 📌 PAYROLL TRENDS */}
          <section>
            <div className="w-full bg-white rounded-2xl shadow-md hover:shadow-lg p-6">
              <PayrollTrends />
            </div>
          </section>


        </>
      )}

      {/* Modals */}
      <ExpenseModal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
      />

      <AddOrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
      />

      <AddTaxSlabModal
        open={showAddTaxModal}
        onClose={() => setShowAddTaxModal(false)}
        onAdd={handleAddTaxSlab}
      />
    </div>
  );
}
