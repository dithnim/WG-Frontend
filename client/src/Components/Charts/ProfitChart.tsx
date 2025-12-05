import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

interface ProfitChartProps {
  profitData: number[];
  revenueData?: number[];
  color?: string;
}

const ProfitChart: React.FC<ProfitChartProps> = ({
  profitData,
  revenueData = [],
  color = "#00ff88",
}) => {
  const chartRef = useRef<ApexCharts | null>(null);

  useEffect(() => {
    const chartElement = document.getElementById("profit-chart");
    if (!chartElement) return;

    const series: any[] = [
      {
        name: "Profit",
        data: profitData,
      },
    ];

    if (revenueData.length > 0) {
      series.push({
        name: "Revenue",
        data: revenueData,
      });
    }

    const options = {
      chart: {
        type: "area",
        height: 280,
        fontFamily: "Inter, sans-serif",
        background: "transparent",
        toolbar: {
          show: false,
        },
        dropShadow: {
          enabled: true,
          top: 0,
          left: 0,
          blur: 15,
          opacity: 0.4,
          color: color,
        },
      },
      series,
      colors: [color, "#f7005f"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      xaxis: {
        categories: [
          "25d ago",
          "20d ago",
          "15d ago",
          "10d ago",
          "5d ago",
          "Now",
        ],
        labels: {
          style: {
            colors: "#666",
            fontSize: "10px",
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#666",
            fontSize: "10px",
          },
          formatter: (value: number) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value.toFixed(0);
          },
        },
      },
      grid: {
        borderColor: "#222",
        strokeDashArray: 4,
        padding: {
          left: 10,
          right: 10,
        },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (value: number) => {
            return `Rs. ${value.toLocaleString()}`;
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: revenueData.length > 0,
        position: "top",
        horizontalAlign: "right",
        labels: {
          colors: "#9ca3af",
        },
        markers: {
          radius: 3,
        },
      },
    };

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new ApexCharts(chartElement, options);
    chartRef.current.render();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [profitData, revenueData, color]);

  return (
    <div className="relative bg-[#0d0d0d] rounded-xl p-5 border border-[#222] overflow-hidden">
      {/* Neon glow effects */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#00ff88] rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#f7005f] rounded-full opacity-10 blur-3xl"></div>

      <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"></span>
        Profit & Revenue Trend
      </h3>
      {profitData.length > 0 ? (
        <div id="profit-chart" className="relative z-10"></div>
      ) : (
        <div className="flex items-center justify-center h-[280px] text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default ProfitChart;
