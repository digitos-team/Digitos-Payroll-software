import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTheme } from '../../Admin Folder/context/ThemeContext'
import { logout } from '../../redux/loginSlice'
import {
    Grid,
    Users,
    DollarSign,
    Settings,
    X,
    Sun,
    Moon,
    LogOut,
    Menu,
    Calendar,
    FileText
} from 'lucide-react'
import SalaryRequestNotification from '../components/SalaryRequestNotification'

const links = [
    { to: '/hr', label: 'Dashboard', icon: Grid },
    { to: '/hr/employees', label: 'Employees', icon: Users },
    { to: '/hr/attendance', label: 'Attendance', icon: Calendar },
    { to: '/hr/leave-requests', label: 'Leave Requests', icon: FileText },
    { to: '/hr/branches', label: 'Branches', icon: Grid },
    { to: '/hr/payrollhistory', label: 'Payroll History', icon: DollarSign },
    { to: '/hr/salary-setting', label: 'Salary Setting', icon: Settings },
    { to: '/hr/settings', label: 'Settings', icon: Settings },
]

function HRSidebar({ mobile = false, onClose }) {
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
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">HR</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-300">Human Resources</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SalaryRequestNotification />
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
                            end={l.to === '/hr'}
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

export default function HRLayout() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full p-4 sm:p-6 lg:p-8 flex gap-6">
                {/* Sidebar for large screens */}
                <aside className="hidden sm:block w-64">
                    <HRSidebar />
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
                        <div className="text-lg font-semibold">HR Dashboard</div>
                        <div />
                    </div>

                    <div className="h-[calc(100vh-64px)] overflow-auto pr-4">
                        <Outlet />
                    </div>
                </div>

                {/* Mobile overlay sidebar */}
                {mobileOpen && (
                    <div className="sm:hidden fixed inset-0 z-40">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                        <div className="absolute left-0 top-0 bottom-0 w-72 p-4">
                            <HRSidebar mobile onClose={() => setMobileOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
