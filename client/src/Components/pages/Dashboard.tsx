import React, { useEffect } from "react";
import Smalltile from "../Charts/Smalltile";
import TopProductsChart from "../Charts/TopProductsChart";
import PaymentMethodChart from "../Charts/PaymentMethodChart";
import StatCard from "../Charts/StatCard";
import ProfitChart from "../Charts/ProfitChart";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  fetchProductCount,
  fetchSaleCount,
  fetchProduct30DayData,
  fetchSupplier30DayData,
  fetchSalesRevenue30DayData,
  fetchSalesCount30DayData,
  fetchStorePerformance,
  setTimeframe,
  selectProducts,
  selectSales,
  selectTimeframe,
  selectDashboardLoading,
  selectProduct30DayData,
  selectSupplier30DayData,
  selectSalesRevenue30DayData,
  selectSalesCount30DayData,
  selectStorePerformance,
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
  const storePerformance = useSelector(selectStorePerformance);

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
    dispatch(fetchStorePerformance());
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
      {/* Summary Tiles */}
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

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <StatCard
          title="Monthly Profit"
          value={`Rs. ${formatCurrency(storePerformance.totalProfit)}`}
          color="#22c55e"
          subtitle="This month's earnings"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Profit Margin"
          value={`${storePerformance.profitMargin.toFixed(1)}%`}
          color="#3b82f6"
          subtitle="Revenue to profit ratio"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <StatCard
          title="Avg. Order Value"
          value={`Rs. ${formatCurrency(storePerformance.averageOrderValue)}`}
          color="#f7005f"
          subtitle="Per transaction"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2">
          <ProfitChart profitData={storePerformance.profit30Days} />
        </div>
        <div>
          <PaymentMethodChart
            paymentMethods={storePerformance.paymentMethodBreakdown}
          />
        </div>
      </div>

      {/* Top Products */}
      <div className="mt-6">
        <TopProductsChart products={storePerformance.topSellingProducts} />
      </div>
    </div>
  );
};

export default Dashboard;
