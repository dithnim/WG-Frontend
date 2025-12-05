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
    <div
      className="relative bg-[#0d0d0d] rounded-xl p-5 border border-[#222] overflow-hidden group hover:border-opacity-50 transition-all duration-300"
      style={{ borderColor: `${color}30` }}
    >
      {/* Neon glow effect on hover */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      ></div>

      <div className="flex items-center gap-4 relative z-10">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${color}15`,
            boxShadow: `0 0 20px ${color}20`,
          }}
        >
          <div style={{ color, filter: `drop-shadow(0 0 8px ${color})` }}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">
            {title}
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color, textShadow: `0 0 20px ${color}40` }}
          >
            {value}
          </p>
          {subtitle && <p className="text-gray-600 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
