import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getUserLeaves } from '../../utils/api/leaveApi';

const EmployeeNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, companyId } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || !companyId) return;

            try {
                const userId = user.id || user._id;
                const companyIdValue = companyId._id || companyId;

                // 1. Fetch Leaves
                // Note: getUserLeaves now uses POST /leave/leave/by-employee
                const leavesRes = await getUserLeaves(companyIdValue, userId);

                let newNotifications = [];

                if (leavesRes.success && Array.isArray(leavesRes.data)) {
                    // Filter for approved leaves in the future or recent past (last 7 days)
                    // For simplicity, showing all 'Approved' status leaves or 'Rejected' to notify user
                    const recentLeaves = leavesRes.data.filter(leave =>
                        leave.Status === 'Approved' || leave.Status === 'Rejected'
                    );

                    // Sort by most recent
                    // Assuming leave.createdAt or similar exists, or we use FromDate

                    recentLeaves.forEach(leave => {
                        newNotifications.push({
                            id: leave._id,
                            type: 'leave',
                            title: `Leave ${leave.Status}`,
                            message: `Your leave for ${new Date(leave.FromDate).toLocaleDateString()} was ${leave.Status.toLowerCase()}.`,
                            date: leave.updatedAt || leave.createdAt,
                            status: leave.Status
                        });
                    });
                }

                // 2. Fetch Salary Slips (Optional enhancement for later due to API complexity)
                // For now, we focus on Leaves as per immediate feasibility.

                // Sort notifications by date (newest first)
                newNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

                setNotifications(newNotifications);

            } catch (err) {
                console.error("Error fetching employee notifications:", err);
            }
        };

        fetchNotifications();

        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);

    }, [user, companyId]);

    const unreadCount = notifications.length; // Simply showing total count for now

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-800 dark:text-white flex justify-between items-center">
                            <span>Notifications</span>
                            <span className="text-xs text-gray-500">{unreadCount} New</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notif, index) => (
                                    <div key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1.5">
                                                    {new Date(notif.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No new notifications
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeeNotifications;
