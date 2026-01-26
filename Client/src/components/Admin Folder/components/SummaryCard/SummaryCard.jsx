import React from "react";

export default function SummaryCard({
  title,
  value,
  Icon,
  color = "bg-blue-500",
}) {
  return (
    <div
      className="
        bg-white dark:bg-gray-800
        rounded-2xl 
        shadow-sm 
        border 
        border-gray-200 dark:border-gray-700
        p-5 
        flex 
        items-center 
        gap-4 
        transition-all 
        duration-300
        hover:shadow-xl
        hover:border-gray-300 dark:hover:border-gray-600
        h-full
      "
    >
      {/* Icon Container */}
      <div
        className={`
          p-3 
          rounded-xl 
          text-white 
          flex 
          items-center 
          justify-center 
          ${color}
        `}
      >
        <Icon className="w-7 h-7" />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</span>
        <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-wide break-words leading-tight">
          {value}
        </span>
      </div>
    </div>
  );
}
