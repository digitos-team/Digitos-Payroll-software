import React from "react";

export default function SummaryCard({ title, value, icon: Icon, color, onClick }) {
  return (
    <div
      className={`flex items-center justify-between bg-white p-4 rounded-2xl shadow hover:shadow-lg transition ${onClick ? "cursor-pointer" : ""
        }`}
      onClick={onClick}
    >
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-2xl font-semibold text-gray-800">{value}</h2>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  );
}
