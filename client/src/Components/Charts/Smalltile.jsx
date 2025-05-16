import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const Smalltile = ({ color, chart_data, Title, count, growth }) => {
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
  }, []);

  return (
    <div className="rounded-xl bg-[#171717] p-2 w-full h-[120px] mb-4">
      <div className="flex justify-between">
        <div className="p-1">
          <h1 className="font-semibold">{Title}</h1>
          <div className="mt-1 text-2xl md:text-3xl" style={{ color: color }}>
            {count}
          </div>
          <div
            className={
              growth > 0
                ? `text-[#00f271] mt-2 flex items-center percentage-sign text-sm md:text-base`
                : growth != 0
                  ? `text-[#f33b3b] mt-2 flex items-center percentage-sign text-sm md:text-base`
                  : `text-white mt-2 flex items-center percentage-sign text-sm md:text-base`
            }
          >
            <i
              className={
                growth > 0
                  ? `bx bx-up-arrow-alt me-1 up-arrow`
                  : growth != 0
                    ? `bx bx-down-arrow-alt me-1 down-arrow`
                    : "bx bx-up-arrow-alt me-1 up-arrow"
              }
            ></i>
            {growth > 0 ? growth : growth * -1}
            {"%"}
          </div>
        </div>
        <div
          ref={chartRef}
          id="area-chart"
          className="h-20 w-20 md:h-24 md:w-24 flex items-center text-black"
        ></div>
      </div>
    </div>
  );
};

export default Smalltile;