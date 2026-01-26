
import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'
import { Grid, MapPin, Layers, CreditCard, BarChart2, Settings, X, Sun, Moon, LogOut, Calendar, Users, Banknote } from 'lucide-react'
import { logout } from '../../../redux/loginSlice'

// import { logout } from '../../redux/loginSlice' // adjust path if needed

const links = [
    { to: '/', label: 'Dashboard', icon: Grid },
    { to: '/finance', label: 'Finance', icon: BarChart2 },
    { to: '/branches', label: 'Branches', icon: MapPin },
    { to: '/departments', label: 'Departments', icon: Layers },
    { to: '/holidays', label: 'Holidays', icon: Calendar },
    { to: '/leave-settings', label: 'Leave Settings', icon: Users },
    { to: '/payroll', label: 'Payroll', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/designation', label: 'Designations', icon: Layers },
    { to: '/salary-requests', label: 'Salary Requests', icon: Calendar },
    { to: '/salary-settings', label: 'Salary Generation', icon: Banknote },
]

export default function Sidebar({ mobile = false, onClose }) {
    const { theme, toggleTheme } = useTheme()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user } = useSelector((state) => state.auth || {})

    // Filter links based on role
    const filteredLinks = links.filter(link => {
        if (user?.role === 'Employee') {
            // Hide salary related links for employees
            if (link.to === '/salary-settings' || link.to === '/salary-requests') {
                return false
            }
        }
        return true
    })

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
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-300">Company Dashboard</p>
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
                    {filteredLinks.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-100 dark:bg-gray-800 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            end={l.to === '/'}
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
