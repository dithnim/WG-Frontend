import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import Toast from "../Toast";
import { Supplier } from "../../types/api";

interface FormData {
  supplierName: string;
  description: string;
  contactNumbers: string;
  email: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [edittingSupplier, setEdittingSupplier] = useState<Supplier | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    supplierName: "",
    description: "",
    contactNumbers: "",
    email: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [supplierIdToDelete, setSupplierIdToDelete] = useState<string | null>(
    null
  );
  const [tempSupplierId, setTempSupplierId] = useState<string | null>(null);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchSuppliers = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get<Supplier[]>("/suppliers", {
        search: searchQuery,
      });
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      if (error.response?.status === 403) {
        setError(
          "CORS error: Server rejected the request. Check API Gateway CORS configuration."
        );
      } else {
        setError(error.message || "Failed to fetch suppliers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openDeleteModal = (id: string): void => {
    setSupplierIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = (): void => {
    setShowDeleteModal(false);
    setSupplierIdToDelete(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // Perform optimistic update and reset form immediately
    if (edittingSupplier) {
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((s) =>
          s._id === edittingSupplier._id ? { ...s, ...formData } : s
        )
      );
    } else {
      const newTempId = "temp_" + Date.now();
      setTempSupplierId(newTempId);
      setSuppliers((prevSuppliers) => [
        ...prevSuppliers,
        { ...formData, _id: newTempId, createdAt: new Date().toISOString() },
      ]);
    }

    // Reset form
    setEdittingSupplier(null);
    setFormData({
      supplierName: "",
      description: "",
      contactNumbers: "",
      email: "",
    });
    setTempSupplierId(null);

    try {
      if (edittingSupplier) {
        const updateData = {
          ...formData,
          _id: edittingSupplier._id,
        };
        await apiService.put<Supplier>(
          `/suppliers?id=${edittingSupplier._id}`,
          updateData
        );
      } else {
        const data = await apiService.post<Supplier>("/suppliers", formData);
        setSuppliers((prevSuppliers) =>
          prevSuppliers.map((s) =>
            s._id === tempSupplierId
              ? {
                  ...s,
                  _id: data._id,
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Error updating/adding supplier:", error);
      fetchSuppliers(); // Refetch to sync state
      if (error.response?.status === 403) {
        setError(
          "CORS error: Server rejected the request. Check API Gateway CORS configuration."
        );
      } else if (error.response?.status === 400) {
        setError(
          error.response?.data?.message ||
            "Invalid supplier data. Please check all fields."
        );
      } else {
        setError(error.message || "Failed to save supplier. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProduct = async (): Promise<void> => {
    if (supplierIdToDelete) {
      const deletedSupplier = suppliers.find(
        (s) => s._id === supplierIdToDelete
      );
      setSuppliers((prevSuppliers) =>
        prevSuppliers.filter((s) => s._id !== supplierIdToDelete)
      );
      closeDeleteModal(); // Close modal immediately

      try {
        await apiService.delete<Supplier>(
          `/suppliers?id=${supplierIdToDelete}`
        );
        setError(null);
      } catch (error) {
        console.error("Error deleting supplier:", error);
        if (deletedSupplier) {
          setSuppliers((prevSuppliers) => [...prevSuppliers, deletedSupplier]);
        }
        if (error.response?.status === 403) {
          setError(
            "CORS error: Server rejected the delete request. Check API Gateway CORS configuration."
          );
        } else {
          setError(
            error.response?.data?.message ||
              error.message ||
              "Failed to delete supplier"
          );
        }
      }
    }
  };

  const handleEdit = (supplier: Supplier): void => {
    console.log("Editing supplier:", supplier);
    setEdittingSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName || "",
      description: supplier.description || "",
      contactNumbers: supplier.contactNumbers || "",
      email: supplier.email || "",
    });
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  return (
    <div className="supplier h-screen p-12">
      {error && <Toast message={error} onClose={() => setError(null)} />}

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg dark:bg-[#171717] dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Delete confirmation popup */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#171717] rounded-lg p-6 w-1/3">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this Supplier?</p>
            <div className="mt-6 flex justify-end">
              <button
                className="text-white px-4 py-2 rounded-lg mr-2 hover:bg-[#5f5f5f] transition-colors border border-neutral-500/50 font-semibold"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="bg-[#a10000] text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                onClick={confirmDeleteProduct}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 h-[40vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
            No suppliers available
          </div>
        ) : (
          <table className="table-auto w-full">
            <thead className="sticky top-0 bg-transparent table-head">
              <tr>
                <th>Supplier name</th>
                <th>Description</th>
                <th>Contact numbers</th>
                <th>Email</th>
                <th>Last updated</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody id="supplier-table-body">
              {suppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td className="px-4 py-2">{supplier.supplierName}</td>
                  <td className="px-4 py-2">{supplier.description}</td>
                  <td className="px-4 py-2">{supplier.contactNumbers}</td>
                  <td className="px-4 py-2">{supplier.email}</td>
                  <td className="px-4 py-2">
                    {supplier.createdAt
                      ? supplier.createdAt.slice(0, 10)
                      : "N/A"}
                  </td>
                  <td className="px-1 py-2">
                    <i
                      className="bx bxs-pencil text-lg ms-5 edit cursor-pointer"
                      onClick={() => handleEdit(supplier)}
                    ></i>
                    <i
                      className="bx bxs-trash text-lg ms-1 delete cursor-pointer"
                      onClick={() => openDeleteModal(supplier._id)}
                    ></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mx-auto px-2 py-2 mt-5">
        <div className="relative z-0 w-full mb-5 group">
          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="supplierName"
                id="floating-supplier-name"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.supplierName}
                required
              />
              <label
                htmlFor="floating-supplier-name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Supplier name
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="description"
                id="floating-description"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.description}
                required
              />
              <label
                htmlFor="floating-description"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="contactNumbers"
                id="floating-contact-numbers"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.contactNumbers}
                required
              />
              <label
                htmlFor="floating-contact-numbers"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Contact numbers
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="email"
                name="email"
                id="floating-email"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.email}
                required
              />
              <label
                htmlFor="floating-email"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Email
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <button
              type="button"
              className="w-full text-gray-300 bg-[#262626] focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none dark:focus:ring-blue-800"
              onClick={() => {
                setEdittingSupplier(null);
                setFormData({
                  supplierName: "",
                  description: "",
                  contactNumbers: "",
                  email: "",
                });
              }}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full text-[#303030] bg-white focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none dark:focus:ring-blue-800"
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : edittingSupplier
                  ? "Update supplier"
                  : "Add supplier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
