import React, { useEffect, useState } from "react";
import Smalltile from "../Charts/Smalltile";
import Largetile from "../Charts/Largetile";
import Piechart from "../Charts/Piechart";
import apiService from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const Dashboard = () => {
  const [supplierCount, setSupplierCount] = useState<number>(() => {
    const stored = localStorage.getItem("localSupplierCount");
    return stored ? Number(stored) : 0;
  });
  const [productCount, setProductCount] = useState<number>(() => {
    const stored = localStorage.getItem("localProductCount");
    return stored ? Number(stored) : 0;
  });
  const [saleCount, setSaleCount] = useState<number>(() => {
    const stored = localStorage.getItem("localSaleCount");
    return stored ? Number(stored) : 0;
  });
  const [revenueCount, setRevenueCount] = useState<number>(() => {
    const stored = localStorage.getItem("localRevenueCount");
    return stored ? Number(stored) : 0;
  });

  const [prevSupplierCount, setPrevSupplierCount] = useState<number>(() => {
    const stored = localStorage.getItem("localPrevSupplierCount");
    return stored ? Number(stored) : 0;
  });
  const [prevProductCount, setPrevProductCount] = useState<number>(() => {
    const stored = localStorage.getItem("localPrevProductCount");
    return stored ? Number(stored) : 0;
  });
  const [prevSaleCount, setPrevSaleCount] = useState<number>(() => {
    const stored = localStorage.getItem("localPrevSaleCount");
    return stored ? Number(stored) : 0;
  });
  const [prevRevenueCount, setPrevRevenueCount] = useState<number>(() => {
    const stored = localStorage.getItem("localPrevRevenueCount");
    return stored ? Number(stored) : 0;
  });

  const [productPercentage, setProductPercentage] = useState<number>(0);
  const [supplierPercentage, setSupplierPercentage] = useState<number>(0);
  const [salePercentage, setSalePercentage] = useState<number>(0);
  const [revenuePercentage, setRevenuePercentage] = useState<number>(0);
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("month");

  useEffect(() => {
    console.log(user);
  }, [user]);

  const fetchSupplierCount = async () => {
    try {
      const data = await apiService.get(`/suppliers/count`, {
        search: timeframe,
      });
      setSupplierCount(data.count);
      setPrevSupplierCount(data.prevCount);
      localStorage.setItem("localSupplierCount", data.count.toString());
      localStorage.setItem("localPrevSupplierCount", data.prevCount.toString());
    } catch (error) {
      console.error("Error fetching supplier count:", error);
    }
  };

  const fetchRevenueCount = async () => {
    try {
      const data = await apiService.get(`/sales/revenue`, {
        search: timeframe,
      });
      setRevenueCount(data.totalRevenue);
      setPrevRevenueCount(data.prevTotalRevenue);
      localStorage.setItem("localRevenueCount", data.totalRevenue.toString());
      localStorage.setItem(
        "localPrevRevenueCount",
        data.prevTotalRevenue.toString()
      );
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  };

  const fetchProductCount = async () => {
    try {
      const data = await apiService.get(`/products/count`, {
        search: timeframe,
      });
      setProductCount(data.count);
      setPrevProductCount(data.prevCount);
      localStorage.setItem("localProductCount", data.count.toString());
      localStorage.setItem("localPrevProductCount", data.prevCount.toString());
    } catch (error) {
      console.error("Error fetching product count:", error);
    }
  };

  const fetchSaleCount = async () => {
    try {
      const data = await apiService.get(`/sales/count`, { search: timeframe });
      setSaleCount(data.count);
      setPrevSaleCount(data.prevCount);
      localStorage.setItem("localSaleCount", data.count.toString());
      localStorage.setItem("localPrevSaleCount", data.prevCount.toString());
    } catch (error) {
      console.error("Error fetching sale count:", error);
    }
  };

  const calculateSalePercentage = () => {
    const percentage =
      prevSaleCount === 0
        ? saleCount * 100
        : prevSaleCount > 0
          ? ((saleCount - prevSaleCount) / prevSaleCount) * 100
          : 0;
    setSalePercentage(Number(percentage.toFixed(2)));
  };

  const calculateProductPercentage = () => {
    const percentage =
      prevProductCount === 0
        ? productCount * 100
        : prevProductCount > 0
          ? ((productCount - prevProductCount) / prevProductCount) * 100
          : 0;
    setProductPercentage(Number(percentage.toFixed(2)));
  };

  const calculateSupplierPercentage = () => {
    const percentage =
      prevSupplierCount === 0
        ? supplierCount * 100
        : prevSupplierCount > 0
          ? ((supplierCount - prevSupplierCount) / prevSupplierCount) * 100
          : 0;
    setSupplierPercentage(Number(percentage.toFixed(2)));
  };

  const calculateRevenuePercentage = () => {
    const percentage =
      prevRevenueCount === 0
        ? revenueCount * 100
        : prevRevenueCount > 0
          ? ((revenueCount - prevRevenueCount) / prevRevenueCount) * 100
          : 0;
    setRevenuePercentage(Number(percentage.toFixed(2)));
  };

  useEffect(() => {
    fetchSupplierCount();
    fetchProductCount();
    fetchSaleCount();
    fetchRevenueCount();
  }, [timeframe]);

  useEffect(() => {
    calculateProductPercentage();
    calculateSupplierPercentage();
    calculateSalePercentage();
    calculateRevenuePercentage();
  }, [
    prevProductCount,
    prevSupplierCount,
    prevSaleCount,
    prevRevenueCount,
    productCount,
    supplierCount,
    saleCount,
    revenueCount,
    timeframe,
  ]);

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-0">
          Dashboard
        </h1>

        <select
          id="categories"
          name="rackNumber"
          className="text-sm rounded-lg block w-full md:w-[20vw] p-2.5 bg-[#171717] dark:text-white mb-4 md:mb-0"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="">Select timeframe</option>
          <option value="day">Last day</option>
          <option value="week">Last week</option>
          <option value="month">Last month</option>
          <option value="year">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Smalltile
          color={"#f7005f"}
          chart_data={[5, 4, 6, 7, 9, 6]}
          Title={"Sales"}
          count={saleCount}
          growth={salePercentage}
        />
        <Smalltile
          color={"#ff5e00"}
          chart_data={[4, 6, 2, 8, 7, 9, 5]}
          Title={"Products"}
          count={productCount}
          growth={productPercentage}
        />
        <Smalltile
          color={"#29eaff"}
          chart_data={[20, 18, 22]}
          Title={"New suppliers"}
          count={supplierCount}
          growth={supplierPercentage}
        />
        <Smalltile
          color={"#bbff00"}
          chart_data={[50126, 49356, 51264, 54629, 53426]}
          Title={"Total revenue"}
          count={revenueCount}
          growth={revenuePercentage}
        />
      </div>

      <div className="flex flex-col lg:flex-row mt-6 h-auto lg:h-[40vh] gap-4">
        <div className="w-full lg:w-2/3">
          <Largetile />
        </div>
        <div className="w-full lg:w-1/3">
          <Piechart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
