import React, { useEffect, useState } from "react";
import Smalltile from "../Charts/Smalltile";
import Largetile from "../Charts/Largetile";
import Piechart from "../Charts/Piechart";

const Dashboard = () => {
  const [supplierCount, setSupplierCount] = useState(() => {
    return localStorage.getItem("localSupplierCount") || 0;
  });
  const [productCount, setProductCount] = useState(() => {
    return localStorage.getItem("localProductCount") || 0;
  });

  const [prevSupplierCount, setPrevSupplierCount] = useState(() => {
    return localStorage.getItem("localPrevSupplierCount") || 0;
  });
  const [prevProductCount, setPrevProductCount] = useState(() => {
    return localStorage.getItem("localPrevProductCount") || 0;
  });

  const [productPercentage, setProductPercentage] = useState(0);
  const [supplierPercentage, setSupplierPercentage] = useState(0);

  const [timeframe, setTimeframe] = useState("month");

  const fetchSupplierCount = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/suppliers/count?search=${timeframe}`
      );
      const data = await response.json();
      setSupplierCount(data.count);
      setPrevSupplierCount(data.prevCount);
      localStorage.setItem("localSupplierCount", data.count);
      localStorage.setItem("localPrevSupplierCount", data.prevCount);
    } catch (error) {
      console.error("Error fetching supplier count:", error);
    }
  };

  const fetchProductCount = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/products/count?search=${timeframe}`
      );
      const data = await response.json();
      setProductCount(data.count);
      setPrevProductCount(data.prevCount);
      localStorage.setItem("localProductCount", data.count);
      localStorage.setItem("localPrevProductCount", data.prevCount);
    } catch (error) {
      console.error("Error fetching product count:", error);
    }
  };

  const caculateProductPercentage = () => {
    const percentage = prevProductCount
      ? ((productCount - prevProductCount) / prevProductCount) * 100
      : 0;
    setProductPercentage(percentage.toFixed(2));
  };

  const caculateSupplierPercentage = () => {
    const percentage = prevSupplierCount
      ? ((supplierCount - prevSupplierCount) / prevSupplierCount) * 100
      : 0;
    setSupplierPercentage(percentage.toFixed(2));
  };

  useEffect(() => {
    fetchSupplierCount();
    fetchProductCount();
  }, [timeframe]);

  useEffect(() => {
    caculateProductPercentage();
    caculateSupplierPercentage();
  }, [
    prevProductCount,
    prevSupplierCount,
    productCount,
    supplierCount,
    timeframe,
  ]);

  return (
    <div className="p-12">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <select
          id="categories"
          name="rackNumber"
          className="text-sm rounded-lg block w-[20vw] p-2.5 bg-[#171717] dark:text-white"
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
      <div className="row1 grid grid-cols-4 mt-8">
        <Smalltile
          color={"#f7005f"}
          chart_data={[5, 4, 6, 7, 9, 6]}
          Title={"Sales"}
          count={65}
          growth={12}
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
          count={53426}
          growth={9}
        />
      </div>
      <div className="flex mt-10 h-[40vh]">
        <Largetile />
        <Piechart />
      </div>
    </div>
  );
};

export default Dashboard;
