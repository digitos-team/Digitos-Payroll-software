import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full p-4 sm:p-6 lg:p-8 flex gap-6">
                {/* Sidebar for large screens */}
                <aside className="hidden sm:block w-64">
                    <Sidebar />
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
                        <div className="text-lg font-semibold">Admin Dashboard</div>
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
                            <Sidebar mobile onClose={() => setMobileOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
