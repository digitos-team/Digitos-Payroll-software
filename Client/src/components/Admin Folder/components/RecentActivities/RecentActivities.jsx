import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getRecentActivities } from '../../../../utils/api/recentActivityApi'

export default function RecentActivities({ activities: propActivities = null, limit = 10 }) {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState('All')
    const [date, setDate] = useState('')

    const { companyId } = useSelector((state) => state.auth)

    useEffect(() => {
        // If activities are passed as props, use them
        if (propActivities && propActivities.length > 0) {
            setActivities(propActivities)
            setLoading(false)
            return
        }

        // Otherwise fetch from API
        const fetchActivities = async () => {
            try {
                setLoading(true)
                const actualCompanyId = companyId?._id || companyId
                if (!actualCompanyId) {
                    setLoading(false)
                    return
                }

                const data = await getRecentActivities(actualCompanyId, limit)

                // Map API response to component format
                // Handle both field names: 'action' and 'ActivityType' (different controllers use different names)
          console.log('Raw API data:', data)
                const mapped = data.map((item, index) => ({
                    id: item._id || index,
                    date: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : '',
                    user: item.userId?.Name || item.userId?.name || item.userId || item.UserName || 'HR',
                    role: item.userId?.Role || item.userId?.role || item.role || 'HR',
                    action: item.action,
                    target: item.target || ''
                }))
                setActivities(mapped)
            } catch (err) {
                console.error('Error fetching activities:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchActivities()
    }, [companyId, propActivities, limit])

    const filtered = activities.filter((s) => {
        if (role !== 'All' && s.role !== role) return false
        if (date && s.date !== date) return false
        return true
    })

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Activities</h3>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-700">Recent Activities</h3>
                <div className="flex gap-2">
                    <select className="border rounded px-2 py-1 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option>All</option>
                        <option>HR</option>
                        <option>Admin</option>
                        <option>CA</option>
                        <option>Employee</option>
                    </select>
                    <input className="border rounded px-2 py-1 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
            </div>

           <div className="space-y-3 overflow-auto flex-1 pr-2">
    {filtered.map((f) => (
        <div key={f.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">{f.date} • {f.role}</div>
            <div className="text-gray-800">
                {f.user} {f.action} {f.target}
            </div>
        </div>
    ))}
    {filtered.length === 0 && (
        <div className="text-gray-500 text-center py-4">No recent activities found.</div>
    )}
</div>
        </div>
    )
}
