import React, { useEffect } from "react";
import ApexCharts from "apexcharts";

const DonutChart = () => {
  useEffect(() => {
    const options = {
      chart: {
        type: "donut",
        height: 280,
      },
      series: [43, 11, 15, 31],
      labels: ["Genuine", "Local", "Helmets", "Others"],
      colors: ["#f7005f", "#29eaff", "#ff5e00","#bbff00"],
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "12px",
          colors: ["#fff"],
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
          radius: 10,
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
            return val + "%";
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
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
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 200
          },
          legend: {
            position: "bottom"
          }
        }
      }]
    };

    const chart = new ApexCharts(
      document.querySelector("#donut-chart"),
      options
    );
    chart.render();

    return () => chart.destroy();
  }, []);

  return (
    <div
      id="donut-chart"
      className="w-full lg:w-[15vw] rounded-lg lg:ms-10 bg-[#171717]"
    ></div>
  );
};

export default DonutChart;