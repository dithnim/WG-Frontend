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
  setTimeframe,
  selectProducts,
  selectSales,
  selectTimeframe,
  selectDashboardLoading,
  selectProduct30DayData,
  selectSupplier30DayData,
  CountListItem,
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

  // Fetch 30-day data on mount
  useEffect(() => {
    dispatch(fetchProduct30DayData());
    dispatch(fetchSupplier30DayData());
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
    if (!sales.countList || sales.countList.length === 0) {
      return [5, 4, 6, 7, 9, 6]; // Default placeholder data
    } else if (sales.countList.length === 1) {
      return [0, sales.countList[0].count];
    } else {
      return sales.countList.map((item: CountListItem) => item.count);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
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
