import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  return (
    <div className="bg-[#171717] rounded-xl p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-xs uppercase tracking-wide">{title}</p>
        <p className="text-white text-xl font-semibold">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
