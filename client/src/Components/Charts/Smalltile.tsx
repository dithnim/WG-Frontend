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
        enabled: false,
      },
      toolbar: {
        show: false,
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
        opacityFrom: 0.55,
        opacityTo: 0,
        shade: "#1C64F2",
        gradientToColors: ["#1C64F2"],
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
    },
    grid: {
      show: false,
      strokeDashArray: 4,
      padding: {
        left: 0,
        right: 0,
        top: 0,
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
    <div className="rounded-xl bg-[#171717] p-3 w-full h-[120px] mb-4">
      <div className="flex justify-between">
        <div className="p-1">
          <h1 className="font-semibold text-sm">{Title}</h1>
          <div className="mt-1 text-xl md:text-2xl" style={{ color: color }}>
            {prefix && <span className="text-sm mr-1">{prefix}</span>}
            {displayValue}
          </div>
          <div
            className={
              growthNum > 0
                ? `text-[#00f271] mt-2 flex items-center percentage-sign text-xs md:text-sm`
                : growthNum !== 0
                  ? `text-[#f33b3b] mt-2 flex items-center percentage-sign text-xs md:text-sm`
                  : `text-white mt-2 flex items-center percentage-sign text-xs md:text-sm`
            }
          >
            <i
              className={
                growthNum > 0
                  ? `bx bx-up-arrow-alt me-1 up-arrow`
                  : growthNum !== 0
                    ? `bx bx-down-arrow-alt me-1 down-arrow`
                    : "bx bx-up-arrow-alt me-1 up-arrow"
              }
            ></i>
            {growthNum > 0 ? growth : (growthNum * -1).toFixed(2)}
            {"%"}
          </div>
        </div>
        <div
          ref={chartRef}
          id="area-chart"
          className="h-20 w-[50%] flex items-center text-black"
        ></div>
      </div>
    </div>
  );
};

export default Smalltile;
