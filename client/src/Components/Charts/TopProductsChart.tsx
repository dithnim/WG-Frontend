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

    const options = {
      chart: {
        type: "bar",
        height: 280,
        fontFamily: "Inter, sans-serif",
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
          borderRadius: 4,
          dataLabels: {
            position: "top",
          },
        },
      },
      colors: ["#f7005f"],
      dataLabels: {
        enabled: true,
        offsetX: -6,
        style: {
          fontSize: "11px",
          colors: ["#fff"],
        },
      },
      xaxis: {
        categories: products.map((p) =>
          p.productName.length > 20
            ? p.productName.substring(0, 20) + "..."
            : p.productName
        ),
        labels: {
          style: {
            colors: "#9ca3af",
            fontSize: "11px",
          },
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
        borderColor: "#374151",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val: number) => `${val} units`,
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
  }, [products]);

  return (
    <div className="bg-[#171717] rounded-xl p-4">
      <h3 className="text-white text-sm font-medium mb-4">
        Top Selling Products
      </h3>
      {products.length > 0 ? (
        <div id="top-products-chart"></div>
      ) : (
        <div className="flex items-center justify-center h-[280px] text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default TopProductsChart;
