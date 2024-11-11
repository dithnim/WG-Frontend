import React, { useEffect } from "react";
import ApexCharts from "apexcharts";

const DonutChart = () => {
  useEffect(() => {
    const options = {
      chart: {
        type: "donut",
        height: 280,
      },
      series: [43, 11, 15, 31], // Data values for each category
      labels: ["Genuine", "Local", "Helmets", "Others"],
      colors: ["#f7005f", "#29eaff", "#ff5e00","#bbff00"], // Colors for each segment
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "12px",
          colors: ["#fff"], // Text color inside the chart
        },
        dropShadow: {
          enabled: true,
          top: 1,
          left: 1,
          blur: 2,
          opacity: 0.7,
        },
        formatter: function (val) {
          return val + "%";
        },
      },
      legend: {
        position: "bottom",
        markers: {
          radius: 10, // Rounded markers in the legend
        },
        itemMargin: {
          horizontal: 8,
          vertical: 4,
        },
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        y: {
          formatter: function (val) {
            return val + "%"; // Show percentage in the tooltip
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%", // Inner hole size
            labels: {
              show: true,
            },
          },
        },
      },
      stroke: {
        show: false,
        width: 0,
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#donut-chart"),
      options
    );
    chart.render();

    return () => chart.destroy(); // Clean up chart on unmount
  }, []);

  return (
    <div
      id="donut-chart"
      className="w-[15vw] rounded-lg ms-10 bg-[#171717]"
    ></div>
  );
};

export default DonutChart;
