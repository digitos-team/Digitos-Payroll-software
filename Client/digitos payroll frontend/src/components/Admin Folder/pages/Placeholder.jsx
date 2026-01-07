import React from 'react'

export default function Placeholder({ title = 'Page' }) {
    return (
        <div className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-gray-600 mt-2">This is a placeholder page for {title}.</p>
        </div>
    )
}
