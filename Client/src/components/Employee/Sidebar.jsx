import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/loginSlice';
import { User, DollarSign, LogOut, LayoutDashboard, Calendar, Sun, Moon } from 'lucide-react';
import { getEmployeeById } from '../../utils/api/employeeapi';
import EmployeeNotifications from './EmployeeNotifications';
import { useTheme } from '../Admin Folder/context/ThemeContext';
import { getAssetUrl } from '../../utils/config';

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [employeeData, setEmployeeData] = useState(null);
  const { theme, toggleTheme } = useTheme();

  console.log('🔍 SIDEBAR - User from Redux:', user);
  console.log('🔍 SIDEBAR - User ID:', user?.id || user?._id);
  console.log('🔍 SIDEBAR - User Name:', user?.name || user?.Name || user?.FullName);
  console.log('🔍 SIDEBAR - User Email:', user?.email || user?.Email);

  // Fetch employee data to get profile photo
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (user?.id || user?._id) {
        try {
          const userId = user.id || user._id;
          const response = await getEmployeeById(userId);
          console.log('🔍 SIDEBAR - Employee data fetched:', response);

          if (response?.data) {
            setEmployeeData(response.data);
          } else if (response) {
            setEmployeeData(response);
          }
        } catch (error) {
          console.error('Error fetching employee data in sidebar:', error);
        }
      }
    };

    fetchEmployeeData();
  }, [user]);

  const menuItems = [
    {
      name: 'My Profile',
      path: '/employee/profile',
      icon: User
    },
    {
      name: 'My Attendance',
      path: '/employee/attendance',
      icon: Calendar
    },
    {
      name: 'My Leaves',
      path: '/employee/leaves',
      icon: Calendar
    },
    {
      name: 'Salary & Slip',
      path: '/employee/salary',
      icon: DollarSign
    }
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col relative z-20 font-sans transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">WorkSpace</h1>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Controls: Notifications & Theme */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <EmployeeNotifications />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ease-in-out
                ${isActive
                  ? 'bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                  <span className="text-sm">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="mb-6 px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
          {/* Profile Photo or Initials */}
          <div className="relative w-10 h-10 flex-shrink-0">
            {employeeData?.ProfilePhoto ? (
              <>
                <img
                  src={getAssetUrl(employeeData.ProfilePhoto)}
                  alt={employeeData?.Name || user?.name || "Employee"}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div
                  className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm"
                  style={{ display: 'none' }}
                >
                  {getInitials(employeeData?.Name || user?.name || user?.Name || user?.FullName)}
                </div>
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {getInitials(employeeData?.Name || user?.name || user?.Name || user?.FullName)}
              </div>
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
              {employeeData?.Name || user?.name || user?.Name || user?.FullName || 'Employee'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {employeeData?.Email || user?.email || user?.Email || 'employee@company.com'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-3 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 text-sm font-medium shadow-lg shadow-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
