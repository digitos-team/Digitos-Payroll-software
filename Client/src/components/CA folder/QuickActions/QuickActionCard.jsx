import React from "react";

export default function QuickActionCard({ title, description, onClick }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>

      <button
        onClick={onClick}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        Execute
      </button>
    </div>
  );
}
