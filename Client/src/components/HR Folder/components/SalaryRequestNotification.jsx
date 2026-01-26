import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getSalarySlipRequests } from '../../../utils/api/salaryRequestApi';

const SalaryRequestNotification = () => {
    const { companyId } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);

    const fetchPendingCount = async () => {
        try {
            const companyIdValue = companyId?._id || companyId?.id || companyId;
            const response = await getSalarySlipRequests(companyIdValue, 'pending');
            setPendingCount(response.data?.length || 0);
        } catch (err) {
            console.error('Error fetching pending count:', err);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchPendingCount();
            // Refresh every 30 seconds
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [companyId]);

    const handleClick = () => {
        navigate('/hr/salary-requests');
    };

    return (
        <button
            onClick={handleClick}
            className="relative p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Salary slip requests"
        >
            <Bell className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {pendingCount > 9 ? '9+' : pendingCount}
                </span>
            )}
        </button>
    );
};

export default SalaryRequestNotification;
