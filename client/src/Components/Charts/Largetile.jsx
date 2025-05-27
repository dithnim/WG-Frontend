import React from "react";
import ApexCharts from "apexcharts";
import { useEffect } from "react";

const Largetile = () => {
  useEffect(() => {
    if (
      document.getElementById("line-chart") &&
      typeof ApexCharts !== "undefined"
    ) {
      const chart = new ApexCharts(
        document.getElementById("line-chart"),
        options
      );
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, []);

  const options = {
    chart: {
      height: "100%",
      type: "line",
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
      style: {
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
      },
    },
    stroke: {
      width: 2,
      curve: "smooth",
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: {
        left: 2,
        right: 2,
        top: -26,
      },
    },
    series: [
      {
        name: "genuine-sales",
        data: [0, 15, 26, 10, 35, 20],
        color: "#33e7f2",
      },
      {
        name: "local-sales",
        data: [0, 25, 10, 15, 5, 25],
        color: "#f34378",
      },
    ],
    xaxis: {
      labels: {
        show: true,
        style: {
          fontFamily: "Inter, sans-serif",
          cssClass: "text-xs font-normal fill-gray-400",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  return (
    <div className="w-full rounded-xl bg-[#171717] pt-5 pe-4 pb-3 h-[40vh]">
      <div id="line-chart"></div>
    </div>
  );
};

export default Largetile;
