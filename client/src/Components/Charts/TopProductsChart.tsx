import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopProductsChartProps {
  products: TopProduct[];
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ products }) => {
  const chartRef = useRef<ApexCharts | null>(null);

  useEffect(() => {
    const chartElement = document.getElementById("top-products-chart");
    if (!chartElement) return;

    // White neon theme colors with varying opacity
    const whiteColors = ["rgba(255,255,255,0.4)"];

    const options = {
      chart: {
        type: "bar",
        height: 300,
        fontFamily: "Inter, sans-serif",
        background: "transparent",
        toolbar: {
          show: false,
        },
      },
      series: [
        {
          name: "Units Sold",
          data: products.map((p) => p.totalQuantity),
        },
      ],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          distributed: true,
          dataLabels: {
            position: "top",
          },
          barHeight: "70%",
        },
      },
      colors: whiteColors,
      dataLabels: {
        enabled: true,
        offsetX: 20,
        style: {
          fontSize: "12px",
          fontWeight: "bold",
          colors: ["#fff"],
        },
        formatter: (val: number) => `${val}`,
        dropShadow: {
          enabled: true,
          blur: 3,
          opacity: 0.5,
        },
      },
      xaxis: {
        categories: products.map((p) =>
          p.productName.length > 25
            ? p.productName.substring(0, 25) + "..."
            : p.productName
        ),
        labels: {
          style: {
            colors: "#666",
            fontSize: "11px",
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
            fontSize: "11px",
          },
        },
      },
      grid: {
        borderColor: "#222",
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val: number) => `${val} units`,
        },
      },
      legend: {
        show: false,
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
  }, [products]);

  return (
    <div
      className="relative bg-[#0d0d0d] rounded-xl p-5 border border-rgba(255,255,255,0.1) overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      {/* White neon glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full opacity-5 blur-3xl"></div>

      <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
        Top Selling Products
      </h3>
      {products.length > 0 ? (
        <div id="top-products-chart" className="relative z-10"></div>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default TopProductsChart;
