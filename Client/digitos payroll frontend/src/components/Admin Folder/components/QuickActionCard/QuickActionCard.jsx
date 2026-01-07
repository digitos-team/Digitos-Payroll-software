import React from "react";

export default function QuickActionCard({
  title,
  desc,
  Icon,
  color = "bg-blue-500",
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group transition h-full"
    >
      <div
        className="
          bg-white dark:bg-gray-800
          rounded-2xl 
          shadow-sm 
          border 
          border-gray-200 dark:border-gray-700
          p-5 
          flex 
          gap-4 
          items-start 
          transition-all 
          duration-300
          group-hover:shadow-xl
          group-hover:border-gray-300 dark:group-hover:border-gray-600
          h-full
        "
      >
        {/* Icon Box */}
        <div
          className={`p-3 rounded-xl text-white flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Text Section */}
        <div className="flex flex-col">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-wide">
            {title}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            {desc}
          </div>
        </div>
      </div>
    </button>
  );
}
