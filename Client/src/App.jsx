import React from 'react'
import AppRoutes from './components/Admin Folder/routes/AppRoutes'
import { Toaster } from 'react-hot-toast';

export default function App() {
    return (
        <>
            <Toaster position="top-right" />
            <AppRoutes />
        </>
    )
}
