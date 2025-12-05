import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

interface ProfitChartProps {
  profitData: number[];
  color?: string;
}

const ProfitChart: React.FC<ProfitChartProps> = ({
  profitData,
  color = "#22c55e",
}) => {
  const chartRef = useRef<ApexCharts | null>(null);

  useEffect(() => {
    const chartElement = document.getElementById("profit-chart");
    if (!chartElement) return;

    const options = {
      chart: {
        type: "area",
        height: 200,
        fontFamily: "Inter, sans-serif",
        sparkline: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      series: [
        {
          name: "Profit",
          data: profitData,
        },
      ],
      colors: [color],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [50, 100],
        },
      },
      stroke: {
        curve: "smooth",
        width: 2,
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
            colors: "#9ca3af",
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
            colors: "#9ca3af",
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
        borderColor: "#374151",
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
  }, [profitData, color]);

  return (
    <div className="bg-[#171717] rounded-xl p-4">
      <h3 className="text-white text-sm font-medium mb-4">
        30-Day Profit Trend
      </h3>
      {profitData.length > 0 ? (
        <div id="profit-chart"></div>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default ProfitChart;
