import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

interface SmallTileProps {
  color: string;
  chart_data: number[];
  Title: string;
  count: number;
  growth: string;
  prefix?: string;
  formatValue?: (value: number) => string;
}

const Smalltile: React.FC<SmallTileProps> = ({
  color,
  chart_data,
  Title,
  count,
  growth,
  prefix = "",
  formatValue,
}) => {
  const chartRef = useRef(null);
  const options = {
    chart: {
      height: "100%",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 10,
        opacity: 0.3,
        color: color,
      },
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    tooltip: {
      enabled: true,
      theme: "dark",
      x: {
        show: false,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      curve: "smooth",
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    series: [
      {
        name: Title,
        data: chart_data,
        color: color,
      },
    ],
    xaxis: {
      categories: [],
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: false,
    },
  };

  useEffect(() => {
    if (chartRef.current) {
      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, [chart_data, color, Title]);

  // Format the display value
  const displayValue = formatValue ? formatValue(count) : count;
  const growthNum = parseFloat(growth);

  return (
    <div
      className="relative rounded-xl bg-[#0d0d0d] p-4 w-full h-[130px] border border-[#222] overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
      style={{ borderColor: `${color}20` }}
    >
      {/* Neon glow effect */}
      <div
        className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: color }}
      ></div>

      <div className="flex justify-between h-full relative z-10">
        <div className="flex flex-col justify-between py-1">
          <h1 className="font-medium text-sm text-gray-400">{Title}</h1>
          <div
            className="text-2xl md:text-3xl font-bold"
            style={{ color: color, textShadow: `0 0 30px ${color}50` }}
          >
            {prefix && (
              <span className="text-base mr-1 opacity-70">{prefix}</span>
            )}
            {displayValue}
          </div>
          <div
            className={`flex items-center text-xs font-medium ${
              growthNum > 0
                ? "text-[#00ff88]"
                : growthNum !== 0
                  ? "text-[#ff3366]"
                  : "text-gray-500"
            }`}
            style={{
              textShadow:
                growthNum > 0
                  ? "0 0 10px #00ff8850"
                  : growthNum !== 0
                    ? "0 0 10px #ff336650"
                    : "none",
            }}
          >
            <span className="text-lg mr-1">
              {growthNum > 0 ? "↑" : growthNum !== 0 ? "↓" : "→"}
            </span>
            {growthNum > 0 ? growth : (growthNum * -1).toFixed(2)}%
          </div>
        </div>
        <div ref={chartRef} className="h-full w-[45%] flex items-end"></div>
      </div>
    </div>
  );
};

export default Smalltile;
