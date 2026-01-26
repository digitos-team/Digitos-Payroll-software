import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTheme } from '../../Admin Folder/context/ThemeContext'
import { logout } from '../../redux/loginSlice'
import {
  Grid,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  Users,
  X,
  Sun,
  Moon,
  LogOut,
  Menu
} from 'lucide-react'

const links = [
  { to: '/ca', label: 'Dashboard', icon: Grid },
  { to: '/ca/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/ca/purchases', label: 'Purchases', icon: Receipt },
  { to: '/ca/revenue', label: 'Revenue', icon: DollarSign },
  { to: '/ca/expenses', label: 'Expenses', icon: TrendingUp },
  { to: '/ca/tax-slab', label: 'Tax Slab', icon: FileText },
  { to: '/ca/view-payroll', label: 'View Payroll', icon: Users },
  { to: '/ca/view-reports', label: 'View Reports', icon: FileText },
  { to: '/ca/salary-settings', label: 'Salary Generation', icon: DollarSign },
]

function CASidebar({ mobile = false, onClose }) {
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className={`rounded-2xl shadow-md hover:shadow-lg p-6 h-full flex flex-col justify-between ${mobile ? 'min-h-screen' : 'sticky top-6'} bg-white dark:bg-gray-900`}>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">CA</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Chartered Accountant</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} title="Toggle theme" className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
            </button>
            {mobile && (
              <button onClick={onClose} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-100 dark:bg-gray-800 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              end={l.to === '/ca'}
            >
              <l.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  )
}

export default function CALayout({ children, deadlines = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full p-4 sm:p-6 lg:p-8 flex gap-6">
        {/* Sidebar for large screens */}
        <aside className="hidden sm:block w-64">
          <CASidebar />
        </aside>

        {/* Main area */}
        <div className="flex-1 bg-transparent">
          {/* Mobile top bar */}
          <div className="sm:hidden flex items-center justify-between mb-4">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="text-lg font-semibold">CA Dashboard</div>
            <div />
          </div>

          <div className="h-[calc(100vh-64px)] overflow-auto pr-4">
            {children}
          </div>
        </div>

        {/* Mobile overlay sidebar */}
        {mobileOpen && (
          <div className="sm:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 p-4">
              <CASidebar mobile onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
