import React, { useEffect, useState } from "react";
import { Home, Users, CreditCard, DollarSign } from "lucide-react";
import { useSelector } from "react-redux";
import SummaryCard from "../components/SummaryCard/SummaryCard";
import QuickActionCard from "../components/QuickActionCard/QuickActionCard";
import RecentActivities from "../components/RecentActivities/RecentActivities";
import AddCompanyModal from "../components/Modals/AddCompanyModal";
import AddUserModal from "../components/Modals/AddUserModal";
import { useBranches } from "../context/BranchContext";
import { Link } from "react-router-dom";
import { getTotalBranches, addBranch } from "../../../utils/api/branchapi";
import { getEmployeeCount, addEmployee } from "../../../utils/api/employeeapi";
import { getTotalPayroll } from "../../../utils/api/payrollapi";
import { getTotalRevenue } from "../../../utils/api/revenueapi";
import ProfitVsExpenseChart from "../components/Charts/DashboardTrend"


export default function DashboardHome() {
  const { reload, branches = [], employees = [] } = useBranches();

  const [totals, setTotals] = useState({
    totalBranches: 0,
    totalEmployees: 0,
    totalPayroll: 0,
    totalRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Fetch totals from backend
  const { companyId, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const actualCompanyId = companyId?._id || companyId;

        // Fetch from backend APIs
        const [branchRes, employeeRes, payrollRes, revenueRes] =
          await Promise.allSettled([
            getTotalBranches(),
            getEmployeeCount(actualCompanyId),
            getTotalPayroll(actualCompanyId),
            getTotalRevenue(actualCompanyId),
          ]);


        // Use backend data if available, otherwise fallback to context/calculated values
        let branchCount = branches.length;
        let employeeCount = employees.length;
        let totalPayroll = 0;
        let totalRevenue = 0;

        // Try backend branch count - returns { success: true, totalBranches: number }
        if (branchRes.status === "fulfilled" && branchRes.value?.success) {
          branchCount = branchRes.value?.totalBranches || branches.length;
        }

        // Try backend employee count - returns { totalEmployees: number }
        if (employeeRes.status === "fulfilled") {
          employeeCount = employeeRes.value?.total || employees.length;
        }

        // Try backend payroll - returns number directly
        if (payrollRes.status === "fulfilled" && payrollRes.value > 0) {
          totalPayroll = payrollRes.value;
        } else if (branches.length > 0) {
          totalPayroll = branches.reduce((sum, b) => {
            return sum + (parseFloat(b.totalSalary) || 0);
          }, 0);
        }

        // Try backend revenue - returns { totalRevenue: number }
        if (revenueRes.status === "fulfilled" && revenueRes.value?.totalRevenue) {
          totalRevenue = revenueRes.value.totalRevenue;
        }


        setTotals({
          totalBranches: branchCount,
          totalEmployees: employeeCount,
          totalPayroll: totalPayroll,
          totalRevenue: totalRevenue,
        });


      } catch (err) {
        // Last resort: use context data
        setTotals({
          totalBranches: branches.length,
          totalEmployees: employees.length,
          totalPayroll: branches.reduce(
            (sum, b) => sum + (parseFloat(b.totalSalary) || 0),
            0
          ),
          totalRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for context to load
    fetchTotals();

  }, [branches, employees, companyId]);

  // Summary Cards Config
  const summary = [
    {
      title: "Total Branches",
      value: loading ? "..." : totals.totalBranches,
      Icon: Home,
      color: "bg-blue-500",
      link: "/branch-list",
    },
    {
      title: "Total Employees",
      value: loading ? "..." : totals.totalEmployees,
      Icon: Users,
      color: "bg-green-500",
      link: "/employees",
    },
    {
      title: "Total Payroll",
      value: loading
        ? "..."
        : `₹ ${(totals.totalPayroll || 0).toLocaleString("en-IN")}`,
      Icon: CreditCard,
      color: "bg-yellow-500",
    },
    {
      title: "Total Revenue",
      value: loading
        ? "..."
        : `₹ ${Math.round(totals.totalRevenue || 0).toLocaleString("en-IN")}`,
      Icon: DollarSign,
      color: "bg-purple-500",
    },

  ];

  // Quick Action Buttons
  const quicks = [
    {
      title: "Add Company (Branches)",
      desc: "Create new branch",
      Icon: Home,
      color: "bg-blue-500",
      onClick: () => setCompanyModalOpen(true),
    },
    {
      title: "Add Employee",
      desc: "Add employee & assign to branch",
      Icon: Users,
      color: "bg-green-500",
      onClick: () => setUserModalOpen(true),
    },
  ];

  // Add Branch Handler
  async function handleAddCompany(data) {
    try {
      const res = await addBranch(data);

      await reload();

      // Update totals including new employee count
      const branchRes = await getTotalBranches();
      const employeeRes = await getEmployeeCount();
      const payrollRes = await getTotalPayroll();
      const revenueRes = await getTotalRevenue();
      setTotals({
        totalBranches: branchRes.data.totalBranches,
        totalEmployees: employeeRes.total || 0,
        totalPayroll: payrollRes,
        totalRevenue: revenueRes?.totalRevenue || 0,
      });

      setActivities((prev) => [
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          user: data.head || "Admin",
          role: "Admin",
          action: `added branch ${data.BranchName || "new branch"}`,
        },
        ...prev,
      ]);

      setCompanyModalOpen(false);

      toast.success("Branch added successfully!");
    } catch (err) {
      toast.error(
        "Failed to add branch: " + (err.response?.data?.message || err.message)
      );
    }
  }

  // Add Employee Handler
  async function handleAddUser(data) {
    try {
      setIsAddingUser(true);
      const res = await addEmployee(data);
      // console.log("Employee added:", res);

      // Optimistic update for Recent Activities
      setActivities((prev) => [
        {
          id: Date.now(),
          date: data.JoiningDate || new Date().toISOString().slice(0, 10),
          user: user?.Name || "Admin",
          role: user?.Role || user?.role || "Admin",
          action: `added employee ${data.Name}`,
          target: ''
        },
        ...prev,
      ]);

      setUserModalOpen(false); // Close first for better UX
      toast.success("Employee added successfully!");

      // Refresh totals in background
      const [employeeRes, payrollRes, revenueRes] = await Promise.all([
        getEmployeeCount(),
        getTotalPayroll(),
        getTotalRevenue()
      ]);

      setTotals((prev) => ({
        ...prev,
        totalEmployees: employeeRes.total || (prev.totalEmployees + 1), // Fallback to +1
        totalPayroll: payrollRes,
        totalRevenue: revenueRes?.totalRevenue || 0,
      }));

    } catch (err) {
      const serverMessage =
        err.response?.data?.message || err.response?.data || err.message;
      toast.error("Failed to add employee: " + (serverMessage || "Unknown error"));
    } finally {
      setIsAddingUser(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards Section */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.map((s) => {
            const card = (
              <SummaryCard
                key={s.title}
                title={s.title}
                value={s.value}
                Icon={s.Icon}
                color={s.color}
              />
            );
            return s.link ? (
              <Link key={s.title} to={s.link} className="block h-full">
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section>
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quicks.map((q) => (
            <div key={q.title} className="h-full">
              <QuickActionCard
                title={q.title}
                desc={q.desc}
                Icon={q.Icon}
                color={q.color}
                onClick={q.onClick}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid: Charts & Activities */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Profit vs Expense Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg p-6 h-full">
          <ProfitVsExpenseChart />
        </div>

        {/* Recent Activities (1/3 width) */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg p-6 h-full">
          <RecentActivities />
        </div>
      </section>


      {/* Modals */}
      <AddCompanyModal
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        onAdd={handleAddCompany}
      />

      <AddUserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onAdd={handleAddUser}
        isLoading={isAddingUser}
      />
    </div>
  );
}
