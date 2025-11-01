import React, { useEffect } from "react";
import Smalltile from "../Charts/Smalltile";
import Largetile from "../Charts/Largetile";
import Piechart from "../Charts/Piechart";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  fetchAllDashboardData,
  setTimeframe,
  selectSuppliers,
  selectProducts,
  selectSales,
  selectRevenue,
  selectTimeframe,
  selectDashboardLoading,
  CountListItem,
} from "../../store/dashboardSlice";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Get data from Redux store
  const suppliers = useSelector(selectSuppliers);
  const products = useSelector(selectProducts);
  const sales = useSelector(selectSales);
  const revenue = useSelector(selectRevenue);
  const timeframe = useSelector(selectTimeframe);
  const loading = useSelector(selectDashboardLoading);

  // Helper functions to format data for charts
  const getProductChartData = (): number[] => {
    if (!products.countList || products.countList.length === 0) {
      return [0, 0, 0, 0, 0];
    } else if (products.countList.length === 1) {
      return [0, products.countList[0].count];
    } else {
      return products.countList.map((item: CountListItem) => item.count);
    }
  };

  const getSupplierChartData = (): number[] => {
    if (!suppliers.countList || suppliers.countList.length === 0) {
      return [0, 0, 0, 0, 0];
    } else if (suppliers.countList.length === 1) {
      return [0, suppliers.countList[0].count];
    } else {
      return suppliers.countList.map((item: CountListItem) => item.count);
    }
  };

  // Fetch all dashboard data on mount and when timeframe changes
  useEffect(() => {
    if (timeframe) {
      dispatch(fetchAllDashboardData(timeframe));
    }
  }, [dispatch, timeframe]);

  // Helper function to get sales chart data
  const getSalesChartData = (): number[] => {
    if (!sales.countList || sales.countList.length === 0) {
      return [5, 4, 6, 7, 9, 6]; // Default placeholder data
    } else if (sales.countList.length === 1) {
      return [0, sales.countList[0].count];
    } else {
      return sales.countList.map((item: CountListItem) => item.count);
    }
  };

  const getRevenueChartData = (): number[] => {
    if (!revenue.countList || revenue.countList.length === 0) {
      return [50126, 49356, 51264, 54629, 53426]; // Default placeholder data
    } else if (revenue.countList.length === 1) {
      return [0, revenue.countList[0].count];
    } else {
      return revenue.countList.map((item: CountListItem) => item.count);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      dispatch(setTimeframe(value));
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Overview</h1>

        <select
          id="categories"
          name="rackNumber"
          className="text-sm rounded-lg block w-full md:w-[20vw] p-2.5 bg-[#171717] dark:text-white mb-4 md:mb-0 border border-gray-400 focus:ring-blue-500 focus:border-blue-500"
          value={timeframe}
          onChange={handleTimeframeChange}
        >
          <option value="day">Last day</option>
          <option value="week">Last week</option>
          <option value="month">Last month</option>
          <option value="year">Last year</option>
        </select>
      </div>

      {loading && (
        <div className="text-center mt-8 text-gray-400">
          Loading dashboard data...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Smalltile
          color={"#f7005f"}
          chart_data={getSalesChartData()}
          Title={"Sales"}
          count={sales.current}
          growth={sales.percentage}
        />
        <Smalltile
          color={"#ff5e00"}
          chart_data={getProductChartData()}
          Title={"Products"}
          count={products.current}
          growth={products.percentage}
        />
        <Smalltile
          color={"#29eaff"}
          chart_data={getSupplierChartData()}
          Title={"Suppliers"}
          count={suppliers.current}
          growth={suppliers.percentage}
        />
        <Smalltile
          color={"#bbff00"}
          chart_data={getRevenueChartData()}
          Title={"Total revenue"}
          count={revenue.current}
          growth={revenue.percentage}
        />
      </div>

      <div className="w-full lg:w-2/3 me-8">
        <Largetile />
      </div>
    </div>
  );
};

export default Dashboard;
