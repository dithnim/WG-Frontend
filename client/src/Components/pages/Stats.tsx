import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import Toast from "../Toast";

const Stats: React.FC = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalSuppliers: 0,
    totalRevenue: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.get("/stats");
        setStats(data);
      } catch (error: any) {
        setError(error.message || "Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="stats-container p-12">
      {error && <Toast message={error} onClose={() => setError(null)} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card bg-[#171717] p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-2xl">{stats.totalSales}</p>
        </div>
        <div className="stats-card bg-[#171717] p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Products</h3>
          <p className="text-2xl">{stats.totalProducts}</p>
        </div>
        <div className="stats-card bg-[#171717] p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Suppliers</h3>
          <p className="text-2xl">{stats.totalSuppliers}</p>
        </div>
        <div className="stats-card bg-[#171717] p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-2xl">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
