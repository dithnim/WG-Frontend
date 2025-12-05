import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

interface BrandSold {
  brand: string;
  count: number;
  revenue: number;
}

interface BrandsChartProps {
  brands: BrandSold[];
}

const BrandsChart: React.FC<BrandsChartProps> = ({ brands }) => {
  const chartRef = useRef<ApexCharts | null>(null);

  useEffect(() => {
    const chartElement = document.getElementById("brands-chart");
    if (!chartElement) return;

    const neonColors = [
      "#f7005f",
      "#00f7ff",
      "#bbff00",
      "#ff5e00",
      "#9d00ff",
      "#00ff88",
    ];

    const options = {
      chart: {
        type: "polarArea",
        height: 300,
        fontFamily: "Inter, sans-serif",
        background: "transparent",
      },
      series: brands.map((b) => b.count),
      labels: brands.map((b) => b.brand || "Unknown"),
      colors: neonColors.slice(0, brands.length),
      stroke: {
        colors: ["#171717"],
        width: 2,
      },
      fill: {
        opacity: 0.8,
      },
      plotOptions: {
        polarArea: {
          rings: {
            strokeWidth: 1,
            strokeColor: "#333",
          },
          spokes: {
            strokeWidth: 1,
            connectorColors: "#333",
          },
        },
      },
      legend: {
        position: "bottom",
        labels: {
          colors: "#9ca3af",
        },
        markers: {
          radius: 3,
        },
        itemMargin: {
          horizontal: 8,
          vertical: 4,
        },
      },
      tooltip: {
        theme: "dark",
        fillSeriesColor: false,
        y: {
          formatter: (val: number) => `${val} units sold`,
        },
      },
      yaxis: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 250,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
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
  }, [brands]);

  return (
    <div className="relative bg-[#0d0d0d] rounded-xl p-5 border border-[#222] overflow-hidden">
      {/* Neon glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#f7005f] rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00f7ff] rounded-full opacity-10 blur-3xl"></div>

      <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#f7005f] shadow-[0_0_10px_#f7005f]"></span>
        Brands Performance
      </h3>
      {brands.length > 0 ? (
        <div id="brands-chart"></div>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No brand data available
        </div>
      )}
    </div>
  );
};

export default BrandsChart;
