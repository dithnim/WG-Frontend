import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import Toast from "../Toast";

interface Sale {
  _id: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
}

interface FormData {
  productId: string;
  quantity: number;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productId: "",
    quantity: 1,
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await apiService.get<Sale[]>("/sales");
      setSales(data);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      setError(error.response?.data?.message || "Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiService.post<Sale>("/sales", formData);
      setFormData({ productId: "", quantity: 1 });
      fetchSales();
    } catch (error: any) {
      console.error("Error creating sale:", error);
      setError(error.response?.data?.message || "Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="sales p-8">
      {error && <Toast message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              placeholder="Product ID"
              required
            />
          </div>
          <div>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="Quantity"
              min="1"
              required
            />
          </div>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Add Sale"}
        </button>
      </form>

      <div className="sales-list">
        <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{sale.productName}</td>
                    <td>{sale.quantity}</td>
                    <td>${sale.totalAmount.toFixed(2)}</td>
                    <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
