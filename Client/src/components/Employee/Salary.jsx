import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Calendar, Download, CheckCircle, Filter,
  Clock, Send, Loader, X, AlertCircle
} from 'lucide-react';
import { getSalaryHistory, requestSlipApproval, downloadSlipPDF, getRequestStatus } from '../../utils/api/salaryApi';

const Salary = () => {
  const { user, companyId } = useSelector((state) => state.auth);
  const [filterDate, setFilterDate] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingSlip, setRequestingSlip] = useState(null);
  const [downloadingSlip, setDownloadingSlip] = useState(null);

  // Helper function to normalize status from API response
  const normalizeStatus = (statusData) => {


    if (!statusData) return 'none';

    const status =
      statusData.status ||
      statusData.approvalStatus ||
      statusData.slipStatus ||
      statusData.data?.status ||
      statusData.data?.approvalStatus ||
      'none';

    const normalizedStatus = String(status).toLowerCase();


    return normalizedStatus;
  };

  // Function to fetch statuses for all records
  const fetchStatuses = async (records, userId, companyIdValue) => {


    const dataWithStatuses = await Promise.all(
      records.map(async (record) => {
        try {

          // 🔥 DEBUG LINE ADDED HERE


          const statusData = await getRequestStatus(userId, record.month, companyIdValue);


          const status = normalizeStatus(statusData);


          return { ...record, slipStatus: status };
        } catch (err) {
          console.error(`❌ SALARY - Error fetching status for ${record.month}:`, err);
          return { ...record, slipStatus: 'none' };
        }
      })
    );


    return dataWithStatuses;
  };

  useEffect(() => {
    const fetchSalaryHistory = async () => {
      const userId = user?.id || user?._id;


      try {
        setLoading(true);
        setError(null);

        const companyIdValue = companyId?._id || companyId?.id || companyId;
        const response = await getSalaryHistory(userId, companyIdValue);

        const transformedData = (response.data || []).map((slip) => ({
          id: slip._id,
          month: slip.Month,
          gross: slip.grossSalary || 0,
          deductions: slip.totalDeductions || 0,
          net: slip.netSalary || 0,
          status: 'Paid',
          slipStatus: 'none',
        }));


        const dataWithStatuses = await fetchStatuses(transformedData, userId, companyIdValue);


        setHistory(dataWithStatuses);
      } catch (err) {
        console.error('❌ SALARY - Error:', err);
        setError(err.message || 'Failed to load salary history');
      } finally {
        setLoading(false);
      }
    };

    if ((user?.id || user?._id) && companyId) {
      fetchSalaryHistory();
    } else {
      console.warn('⚠️ SALARY - Missing user ID or company ID');
      setLoading(false);
    }
  }, [user, companyId]);

  // Auto-refresh statuses every 5 seconds
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId || history.length === 0) return;

    const hasPendingRequests = history.some(item => item.slipStatus === 'pending');
    if (!hasPendingRequests) return;


    const intervalId = setInterval(async () => {


      const updatedHistory = await Promise.all(
        history.map(async (record) => {
          if (record.slipStatus === 'pending') {
            try {
              const companyIdValue = companyId?._id || companyId?.id || companyId;
              const statusData = await getRequestStatus(userId, record.month, companyIdValue);
              const newStatus = normalizeStatus(statusData);

              if (newStatus !== 'pending') {


                if (newStatus === 'approved') {
                  setError('✅ Request approved! You can now download the slip.');
                  setTimeout(() => setError(null), 5000);
                } else if (newStatus === 'rejected') {
                  setError('❌ Request was rejected. You can request again.');
                  setTimeout(() => setError(null), 5000);
                }
              }

              return { ...record, slipStatus: newStatus };
            } catch (err) {
              console.error(`Error refreshing status for ${record.month}:`, err);
              return record;
            }
          }
          return record;
        })
      );

      setHistory(updatedHistory);
    }, 5000);

    return () => {

      clearInterval(intervalId);
    };
  }, [history, user]);

  const handleRequestSlip = async (month) => {

    console.log(`🔵 ============================================`);

    try {
      setRequestingSlip(month);
      setError(null);

      const userId = user?.id || user?._id;
      const companyIdValue = companyId?._id || companyId?.id || companyId;

      console.log(`🔵 User ID: ${userId}, Company ID: ${companyIdValue}`);

      const response = await requestSlipApproval(userId, month, companyIdValue);
      console.log('✅ Request API response:', JSON.stringify(response, null, 2));

      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        console.log(`🔍 Fetching status after request for ${month}...`);
        const statusData = await getRequestStatus(userId, month, companyIdValue);
        console.log('📊 Status API response:', JSON.stringify(statusData, null, 2));

        const actualStatus = normalizeStatus(statusData);
        console.log(`✅ Actual status after request: ${actualStatus}`);

        setHistory(prevHistory => {
          const updated = prevHistory.map(item =>
            item.month === month ? { ...item, slipStatus: actualStatus } : item
          );
          console.log('📝 Updated history:', updated);
          return updated;
        });

        if (actualStatus === 'approved') {
          setError('✅ Request approved! You can now download the slip.');
          setTimeout(() => setError(null), 5000);
        } else if (actualStatus === 'pending') {
          setError('⏳ Request submitted! Waiting for HR approval.');
          setTimeout(() => setError(null), 5000);
        }
      } catch (statusErr) {
        console.error('❌ Error fetching status after request:', statusErr);

        setHistory(prevHistory =>
          prevHistory.map(item =>
            item.month === month ? { ...item, slipStatus: 'pending' } : item
          )
        );
      }

    } catch (err) {
      console.error('❌ SALARY - Request error:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));

      if (err.alreadyExists || err.message?.includes('already')) {
        console.log(`⚠️ SALARY - Request already exists, fetching actual status...`);

        try {
          const userId = user?.id || user?._id;
          const companyIdValue = companyId?._id || companyId?.id || companyId;
          const statusData = await getRequestStatus(userId, month, companyIdValue);
          const actualStatus = normalizeStatus(statusData);

          console.log(`✅ SALARY - Actual status: ${actualStatus}`);

          setHistory(prevHistory =>
            prevHistory.map(item =>
              item.month === month ? { ...item, slipStatus: actualStatus } : item
            )
          );
        } catch (statusErr) {
          console.error('Error fetching status:', statusErr);
        }

        setError(err.message || 'Request already submitted');
      } else {
        setError(err.message || 'Failed to request salary slip');
      }
    } finally {
      setRequestingSlip(null);
      console.log(`🔵 ============================================`);
      console.log(`🔵 Request process completed for: ${month}`);
      console.log(`🔵 ============================================`);
    }
  };

  const handleDownload = async (month) => {
    console.log(`📥 Downloading slip for: ${month}`);

    try {
      setDownloadingSlip(month);
      setError(null);

      const userId = user?.id || user?._id;
      await downloadSlipPDF(userId, month);

      console.log('✅ Download successful');

    } catch (err) {
      console.error('❌ Download error:', err);

      if (err.needsRequest) {
        setError('Please request approval from HR before downloading');
      } else if (err.status === 'pending') {
        setError('Your download request is pending HR approval');
      } else if (err.status === 'rejected') {
        setError('Your download request was rejected. Please request again.');
      } else {
        setError(err.message || 'Failed to download salary slip');
      }
    } finally {
      setDownloadingSlip(null);
    }
  };

  const handleRefreshSingleStatus = async (month) => {
    console.log(`🔄 SALARY - Refreshing status for: ${month}`);
    const userId = user?.id || user?._id;
    const companyIdValue = companyId?._id || companyId?.id || companyId;

    try {
      const statusData = await getRequestStatus(userId, month, companyIdValue);
      console.log(`📊 Refresh - Status data for ${month}:`, JSON.stringify(statusData, null, 2));

      const actualStatus = normalizeStatus(statusData);
      console.log(`✅ SALARY - Refreshed status for ${month}: ${actualStatus}`);

      setHistory(prevHistory =>
        prevHistory.map(item =>
          item.month === month ? { ...item, slipStatus: actualStatus } : item
        )
      );

      if (actualStatus === 'approved') {
        setError('✅ Request approved! You can now download the slip.');
        setTimeout(() => setError(null), 3000);
      } else if (actualStatus === 'pending') {
        setError('⏳ Request is still pending HR approval');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('❌ SALARY - Error refreshing status:', err);
      setError('Failed to refresh status');
    }
  };

  const handleRefresh = async () => {
    const userId = user?.id || user?._id;
    const companyIdValue = companyId?._id || companyId?.id || companyId;

    if (!userId || !history.length) {
      window.location.reload();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedHistory = await fetchStatuses(history, userId, companyIdValue);
      setHistory(updatedHistory);
      console.log('✅ Refresh complete');
    } catch (err) {
      console.error('❌ Refresh error:', err);
      setError('Failed to refresh statuses');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (!filterDate) return history;
    const [year, month] = filterDate.split('-');
    const formattedFilter = `${year}-${String(month).padStart(2, '0')}`;
    return history.filter(item => item.month === formattedFilter);
  };

  const filteredData = getFilteredHistory();

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-4 md:p-8 font-sans flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading salary history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto p-4 md:p-8 font-sans">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 ${error.startsWith('✅') || error.startsWith('⏳') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-xl flex items-center gap-3`}
          >
            {error.startsWith('✅') || error.startsWith('⏳') ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`${error.startsWith('✅') || error.startsWith('⏳') ? 'text-green-800' : 'text-red-800'} font-medium`}>{error}</p>
            <button
              onClick={() => setError(null)}
              className={`ml-auto ${error.startsWith('✅') || error.startsWith('⏳') ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Salary History</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                title="Refresh to see latest approval status"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Filter size={16} />
                </div>
                <input
                  type="month"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:bg-white transition-colors"
                />
              </div>
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-xs text-red-500 font-medium hover:text-red-700 underline">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slip Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <motion.tr
                      key={record.id}
                      whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                      className="group transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatMonth(record.month)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{record.gross.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">-₹{record.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">₹{record.net.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={12} /> {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${record.slipStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          record.slipStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                            record.slipStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {record.slipStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {record.slipStatus === 'approved' ? (
                            <button
                              onClick={() => handleDownload(record.month)}
                              disabled={downloadingSlip === record.month}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                              title="Download Salary Slip"
                            >
                              {downloadingSlip === record.month ? (
                                <>
                                  <Loader size={16} className="animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download size={16} />
                                  Download
                                </>
                              )}
                            </button>
                          ) : record.slipStatus === 'pending' ? (
                            <button
                              onClick={() => handleRefreshSingleStatus(record.month)}
                              className="flex items-center gap-1 text-amber-600 font-medium text-sm bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Click to check if HR has approved"
                            >
                              <Clock size={16} />
                              Check Status
                            </button>
                          ) : record.slipStatus === 'rejected' ? (
                            <button
                              onClick={() => handleRequestSlip(record.month)}
                              disabled={requestingSlip === record.month}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                              title="Request was rejected - click to request again"
                            >
                              {requestingSlip === record.month ? (
                                <>
                                  <Loader size={14} className="animate-spin" />
                                  Requesting...
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  Request Again
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestSlip(record.month)}
                              disabled={requestingSlip === record.month}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              title="Request approval from HR"
                            >
                              {requestingSlip === record.month ? (
                                <>
                                  <Loader size={14} className="animate-spin" />
                                  Requesting...
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  Request Approval
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500 text-sm">
                      {filterDate ? 'No records found for the selected month.' : 'No salary history available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Salary;
