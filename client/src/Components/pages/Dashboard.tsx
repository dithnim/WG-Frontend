import React, { useEffect, useState } from "react";
import Smalltile from "../Charts/Smalltile";
import Largetile from "../Charts/Largetile";
import Piechart from "../Charts/Piechart";
import apiService from "../../services/api";

const Dashboard = () => {
  const [supplierCount, setSupplierCount] = useState(() => {
    const saved = localStorage.getItem("localSupplierCount");
    return saved ? Number(saved) : 0;
  });
  const [productCount, setProductCount] = useState(() => {
    const saved = localStorage.getItem("localProductCount");
    return saved ? Number(saved) : 0;
  });
  const [saleCount, setSaleCount] = useState(() => {
    return localStorage.getItem("localSaleCount") || 0;
  });
  const [revenueCount, setRevenueCount] = useState(() => {
    return localStorage.getItem("localRevenueCount") || 0;
  });

  const [prevSupplierCount, setPrevSupplierCount] = useState(() => {
    const saved = localStorage.getItem("localPrevSupplierCount");
    return saved ? Number(saved) : 0;
  });
  const [prevProductCount, setPrevProductCount] = useState(() => {
    const saved = localStorage.getItem("localPrevProductCount");
    return saved ? Number(saved) : 0;
  });
  const [prevSaleCount, setPrevSaleCount] = useState(() => {
    return localStorage.getItem("localPrevSaleCount") || 0;
  });
  const [prevRevenueCount, setPrevRevenueCount] = useState(() => {
    return localStorage.getItem("localPrevRevenueCount") || 0;
  });

  const [productPercentage, setProductPercentage] = useState(0);
  const [supplierPercentage, setSupplierPercentage] = useState(0);
  const [salePercentage, setSalePercentage] = useState(0);
  const [revenuePercentage, setRevenuePercentage] = useState(0);

  const [timeframe, setTimeframe] = useState("month");

  //?States for counting
  const [productCountList, setProductCountList] = useState(() => {
    const savedList = localStorage.getItem("productCountList");
    return savedList ? JSON.parse(savedList) : [];
  });

  const [supplierCountList, setSupplierCountList] = useState(() => {
    const savedList = localStorage.getItem("supplierCountList");
    return savedList ? JSON.parse(savedList) : [];
  });

  // Add this new function to format data for chart
  const getProductChartData = () => {
    if (!productCountList || productCountList.length === 0) {
      return [0, 0, 0, 0, 0];
    } else if (productCountList.length === 1) {
      return [0, productCountList[0].count];
    } else {
      return productCountList.map((item) => item.count);
    }
  };

  const getSupplierChartData = () => {
    if (!supplierCountList || supplierCountList.length === 0) {
      return [0, 0, 0, 0, 0];
    } else if (supplierCountList.length === 1) {
      return [0, supplierCountList[0].count];
    } else {
      return supplierCountList.map((item) => item.count);
    }
  };

  const fetchSupplierCount = async () => {
    try {
      const data = await apiService.get(`/suppliers/count`, {
        search: timeframe,
      });

      // Store daily count
      const today = new Date().toISOString().split("T")[0];
      const newCount = {
        count: data.totalCount || 0,
        date: today,
        updatedAt: new Date().toISOString(),
      };

      // First update the count list
      setSupplierCountList((prevList) => {
        const updatedList = [...prevList];
        const existingIndex = updatedList.findIndex(
          (item) => item.date === today
        );

        if (existingIndex !== -1) {
          updatedList[existingIndex] = newCount;
        } else {
          updatedList.push(newCount);
        }

        // Keep only last 30 days of data
        const filteredList = updatedList.slice(-30);
        localStorage.setItem("supplierCountList", JSON.stringify(filteredList));
        return filteredList;
      });

      // Then update the counts
      const currentCount = data.totalCount || 0;
      setSupplierCount(currentCount);
      localStorage.setItem("localSupplierCount", currentCount);

      // Get previous count from the list after it's updated
      setSupplierCountList((prevList) => {
        const previousCount = prevList.length > 0 ? prevList[0].count : 0;
        setPrevSupplierCount(previousCount);
        localStorage.setItem("localPrevSupplierCount", previousCount);
        return prevList;
      });
    } catch (error) {
      console.error("Error fetching supplier count:", error);
      // Set default values in case of error
      setSupplierCount(0);
      setPrevSupplierCount(0);
      localStorage.setItem("localSupplierCount", 0);
      localStorage.setItem("localPrevSupplierCount", 0);
    }
  };

  const fetchRevenueCount = async () => {
    try {
      const data = await apiService.get(`/sales/revenue`, {
        search: timeframe,
      });
      setRevenueCount(data.totalRevenue);
      setPrevRevenueCount(data.prevTotalRevenue);
      localStorage.setItem("localRevenueCount", data.totalRevenue);
      localStorage.setItem("localPrevRevenueCount", data.prevTotalRevenue);
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  };

  const fetchProductCount = async () => {
    try {
      const data = await apiService.get(`/products/count`, {
        search: timeframe,
      });

      // Store daily count
      const today = new Date().toISOString().split("T")[0];
      const newCount = {
        count: data.totalCount || 0,
        date: today,
        updatedAt: new Date().toISOString(),
      };

      setProductCountList((prevList) => {
        const updatedList = [...prevList];
        const existingIndex = updatedList.findIndex(
          (item) => item.date === today
        );

        if (existingIndex !== -1) {
          updatedList[existingIndex] = newCount;
        } else {
          updatedList.push(newCount);
        }

        // Keep only last 30 days of data
        const filteredList = updatedList.slice(-30);
        localStorage.setItem("productCountList", JSON.stringify(filteredList));
        return filteredList;
      });

      // Update current and previous counts
      setProductCount(data.totalCount || 0);
      const previousCount =
        productCountList.length > 0 ? productCountList[0].count : 0;
      setPrevProductCount(previousCount);

      localStorage.setItem("localProductCount", data.totalCount || 0);
      localStorage.setItem("localPrevProductCount", previousCount);
    } catch (error) {
      console.error("Error fetching product count:", error);
    }
  };

  const fetchSaleCount = async () => {
    try {
      const data = await apiService.get(`/sales/count`, { search: timeframe });
      setSaleCount(data.count);
      setPrevSaleCount(data.prevCount);
      localStorage.setItem("localSaleCount", data.count);
      localStorage.setItem("localPrevSaleCount", data.prevCount);
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
    setSalePercentage(percentage.toFixed(2));
  };

  const calculateProductPercentage = () => {
    const current = Number(productCount || 0);
    const previous = Number(prevProductCount || 0);

    let percentage = 0;

    if (current === 0 && previous === 0) {
      percentage = 0;
    } else if (previous === 0) {
      percentage = 100; // If previous was 0 and now we have a value, it's a 100% increase
    } else {
      percentage = ((current - previous) / previous) * 100;
    }

    if (isNaN(percentage)) {
      percentage = 0;
    }

    setProductPercentage(percentage.toFixed(2));
  };

  const calculateSupplierPercentage = () => {
    const current = Number(supplierCount || 0);
    const previous = Number(prevSupplierCount || 0);

    let percentage = 0;

    if (current === 0 && previous === 0) {
      percentage = 0;
    } else if (previous === 0) {
      percentage = 100; // If previous was 0 and now we have a value, it's a 100% increase
    } else {
      percentage = ((current - previous) / previous) * 100;
    }

    if (isNaN(percentage)) {
      percentage = 0;
    }

    setSupplierPercentage(percentage.toFixed(2));
  };

  const calculateRevenuePercentage = () => {
    const percentage =
      prevRevenueCount === 0
        ? revenueCount * 100
        : prevRevenueCount > 0
          ? ((revenueCount - prevRevenueCount) / prevRevenueCount) * 100
          : 0;
    setRevenuePercentage(percentage.toFixed(2));
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
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Overview</h1>

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
          chart_data={getProductChartData()}
          Title={"Products"}
          count={productCount}
          growth={productPercentage}
        />
        <Smalltile
          color={"#29eaff"}
          chart_data={getSupplierChartData()}
          Title={"Suppliers"}
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

      <div className="w-full lg:w-2/3 me-8">
        <Largetile />
      </div>
    </div>
  );
};

export default Dashboard;
