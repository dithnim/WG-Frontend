import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

interface PaymentMethod {
  method: string;
  count: number;
  total: number;
}

interface PaymentMethodChartProps {
  paymentMethods: PaymentMethod[];
}

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({
  paymentMethods,
}) => {
  const chartRef = useRef<ApexCharts | null>(null);

  useEffect(() => {
    const chartElement = document.getElementById("payment-method-chart");
    if (!chartElement) return;

    const colorMap: Record<string, string> = {
      cash: "#22c55e",
      card: "#3b82f6",
      online: "#f7005f",
    };

    const options = {
      chart: {
        type: "donut",
        height: 280,
        fontFamily: "Inter, sans-serif",
      },
      series: paymentMethods.map((p) => p.count),
      labels: paymentMethods.map(
        (p) => p.method.charAt(0).toUpperCase() + p.method.slice(1)
      ),
      colors: paymentMethods.map((p) => colorMap[p.method] || "#6b7280"),
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
        formatter: function (val: number) {
          return val.toFixed(1) + "%";
        },
      },
      legend: {
        position: "bottom",
        labels: {
          colors: "#9ca3af",
        },
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
          formatter: function (val: number) {
            return val + " transactions";
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: {
                show: true,
                color: "#9ca3af",
              },
              value: {
                show: true,
                color: "#fff",
                formatter: function (val: string) {
                  return val;
                },
              },
              total: {
                show: true,
                label: "Total",
                color: "#9ca3af",
                formatter: function (w: any) {
                  return w.globals.seriesTotals.reduce(
                    (a: number, b: number) => a + b,
                    0
                  );
                },
              },
            },
          },
        },
      },
      stroke: {
        show: false,
        width: 0,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 200,
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
  }, [paymentMethods]);

  return (
    <div className="bg-[#171717] rounded-xl p-4">
      <h3 className="text-white text-sm font-medium mb-4">Payment Methods</h3>
      {paymentMethods.length > 0 ? (
        <div id="payment-method-chart"></div>
      ) : (
        <div className="flex items-center justify-center h-[280px] text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default PaymentMethodChart;
