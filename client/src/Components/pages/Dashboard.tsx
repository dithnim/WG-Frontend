import React, { useEffect } from "react";
import Smalltile from "../Charts/Smalltile";
import Largetile from "../Charts/Largetile";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  fetchProductCount,
  fetchSaleCount,
  fetchProduct30DayData,
  fetchSupplier30DayData,
  fetchSalesRevenue30DayData,
  fetchSalesCount30DayData,
  setTimeframe,
  selectProducts,
  selectSales,
  selectTimeframe,
  selectDashboardLoading,
  selectProduct30DayData,
  selectSupplier30DayData,
  selectSalesRevenue30DayData,
  selectSalesCount30DayData,
} from "../../store/dashboardSlice";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Get data from Redux store
  const products = useSelector(selectProducts);
  const sales = useSelector(selectSales);
  const timeframe = useSelector(selectTimeframe);
  const loading = useSelector(selectDashboardLoading);
  const product30DayData = useSelector(selectProduct30DayData);
  const supplier30DayData = useSelector(selectSupplier30DayData);
  const salesRevenue30DayData = useSelector(selectSalesRevenue30DayData);
  const salesCount30DayData = useSelector(selectSalesCount30DayData);

  // Helper functions to format data for charts
  const getProductChartData = (): number[] => {
    // Use the 30-day API data from Redux
    if (product30DayData.counts && product30DayData.counts.length > 0) {
      return product30DayData.counts;
    }

    // Fallback to default
    return [0, 0, 0, 0, 0];
  };

  const getSupplierChartData = (): number[] => {
    // Use the 30-day API data from Redux
    if (supplier30DayData.counts && supplier30DayData.counts.length > 0) {
      return supplier30DayData.counts;
    }

    // Fallback to default
    return [0, 0, 0, 0, 0];
  };

  const getProductGrowthPercentage = (): string => {
    if (product30DayData.counts && product30DayData.counts.length > 0) {
      // Compare first count (30 days ago) with last count (most recent)
      const firstCount = product30DayData.counts[0];
      const lastCount =
        product30DayData.counts[product30DayData.counts.length - 1];

      if (firstCount === 0) return "0.00";

      const percentage = ((lastCount - firstCount) / firstCount) * 100;
      return percentage.toFixed(2);
    }
    return "0.00";
  };

  const getSupplierGrowthPercentage = (): string => {
    if (supplier30DayData.counts && supplier30DayData.counts.length > 0) {
      // Compare first count (30 days ago) with last count (most recent)
      const firstCount = supplier30DayData.counts[0];
      const lastCount =
        supplier30DayData.counts[supplier30DayData.counts.length - 1];

      if (firstCount === 0) return "0.00";

      const percentage = ((lastCount - firstCount) / firstCount) * 100;
      return percentage.toFixed(2);
    }
    return "0.00";
  };

  // Helper functions for sales revenue chart data
  const getSalesRevenueChartData = (): number[] => {
    // Use the 30-day API data from Redux
    if (
      salesRevenue30DayData.revenues &&
      salesRevenue30DayData.revenues.length > 0
    ) {
      return salesRevenue30DayData.revenues;
    }

    // Fallback to default
    return [0, 0, 0, 0, 0];
  };

  const getSalesRevenueGrowthPercentage = (): string => {
    if (
      salesRevenue30DayData.revenues &&
      salesRevenue30DayData.revenues.length > 0
    ) {
      // Compare first revenue (30 days ago) with last revenue (most recent)
      const firstRevenue = salesRevenue30DayData.revenues[0];
      const lastRevenue =
        salesRevenue30DayData.revenues[
          salesRevenue30DayData.revenues.length - 1
        ];

      if (firstRevenue === 0) return "0.00";

      const percentage = ((lastRevenue - firstRevenue) / firstRevenue) * 100;
      return percentage.toFixed(2);
    }
    return "0.00";
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // Fetch 30-day data on mount
  useEffect(() => {
    dispatch(fetchProduct30DayData());
    dispatch(fetchSupplier30DayData());
    dispatch(fetchSalesRevenue30DayData());
    dispatch(fetchSalesCount30DayData());
  }, [dispatch]);

  // Fetch dashboard data on mount and when timeframe changes
  useEffect(() => {
    if (timeframe) {
      dispatch(fetchProductCount(timeframe));
      dispatch(fetchSaleCount(timeframe));
    }
  }, [dispatch, timeframe]);

  // Helper function to get sales chart data
  const getSalesChartData = (): number[] => {
    // Use the 30-day API data from Redux
    if (salesCount30DayData.counts && salesCount30DayData.counts.length > 0) {
      return salesCount30DayData.counts;
    }

    // Fallback to default
    return [0, 0, 0, 0, 0, 0];
  };

  // Helper function to get sales growth percentage
  const getSalesGrowthPercentage = (): string => {
    if (salesCount30DayData.counts && salesCount30DayData.counts.length > 0) {
      // Compare first count (30 days ago) with last count (most recent)
      const firstCount = salesCount30DayData.counts[0];
      const lastCount =
        salesCount30DayData.counts[salesCount30DayData.counts.length - 1];

      if (firstCount === 0) return "0.00";

      const percentage = ((lastCount - firstCount) / firstCount) * 100;
      return percentage.toFixed(2);
    }
    return "0.00";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Smalltile
          color={"#f7005f"}
          chart_data={getSalesRevenueChartData()}
          Title={"Monthly Revenue"}
          count={salesRevenue30DayData.currentRevenue}
          growth={getSalesRevenueGrowthPercentage()}
          prefix="Rs."
          formatValue={formatCurrency}
        />
        <Smalltile
          color={"#22c55e"}
          chart_data={getSalesChartData()}
          Title={"Sales Count"}
          count={salesCount30DayData.currentCount}
          growth={getSalesGrowthPercentage()}
        />
        <Smalltile
          color={"#ff5e00"}
          chart_data={getProductChartData()}
          Title={"Products"}
          count={product30DayData.currentCount}
          growth={getProductGrowthPercentage()}
        />
        <Smalltile
          color={"#29eaff"}
          chart_data={getSupplierChartData()}
          Title={"Suppliers"}
          count={supplier30DayData.currentCount}
          growth={getSupplierGrowthPercentage()}
        />
      </div>

      <div className="w-full lg:w-2/3 me-8">
        <Largetile />
      </div>
    </div>
  );
};

export default Dashboard;
