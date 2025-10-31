import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import Toast from "../toastDanger";
import GrantWrapper from "../../util/grantWrapper";

interface Supplier {
  _id: string;
  supplierName: string;
  description?: string;
  contact?: string;
  contactPerson?: string;
  createdAt?: string;
}

interface FormData {
  supplierName: string;
  description?: string;
  contact?: string;
  contactPerson?: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [edittingSupplier, setEdittingSupplier] = useState<Supplier | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const LIMIT = 8;
  const [formData, setFormData] = useState<FormData>({
    supplierName: "",
    description: "",
    contact: "",
    contactPerson: "",
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

  const fetchSuppliers = async (opts?: { reset?: boolean }): Promise<void> => {
    const reset = !!opts?.reset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const currentPage = reset ? 1 : page;
      const params: Record<string, any> = {
        search: searchQuery,
        limit: LIMIT,
        page: currentPage,
        skip: (currentPage - 1) * LIMIT,
      };
      const data: Supplier[] = await apiService.get("/suppliers", params);

      if (reset) {
        setSuppliers(data);
      } else {
        setSuppliers((prev: Supplier[]) => {
          // Prevent duplicates by _id when appending
          const existingIds = new Set(prev.map((s) => s._id));
          const merged = [...prev];
          data.forEach((item) => {
            if (!existingIds.has(item._id)) merged.push(item);
          });
          return merged;
        });
      }

      setHasMore(data.length === LIMIT);
      setPage((p) => (reset ? 2 : data.length > 0 ? p + 1 : p));
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      if (error.response?.status === 403) {
        setError(
          "CORS error: Server rejected the request. Check API Gateway CORS configuration."
        );
      } else {
        setError(error.message || "Failed to fetch suppliers");
      }
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset pagination on new search and fetch first page
      setPage(1);
      setHasMore(true);
      fetchSuppliers({ reset: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Initial load (first page)
    setPage(1);
    setHasMore(true);
    fetchSuppliers({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    const thresholdPx = 48; // prefetch when 48px from bottom
    const nearBottom =
      target.scrollTop + target.clientHeight >=
      target.scrollHeight - thresholdPx;
    if (nearBottom && hasMore && !loading && !loadingMore) {
      fetchSuppliers();
    }
  };

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
      setSuppliers((prevSuppliers: Supplier[]) =>
        prevSuppliers.map((s: Supplier) =>
          s._id === edittingSupplier._id ? { ...s, ...formData } : s
        )
      );
    } else {
      const newTempId = "temp_" + Date.now();
      setTempSupplierId(newTempId);
      setSuppliers((prevSuppliers: Supplier[]) => [
        ...prevSuppliers,
        {
          ...formData,
          _id: newTempId,
          createdAt: new Date().toISOString(),
        } as Supplier,
      ]);
    }

    // Reset form
    setEdittingSupplier(null);
    setFormData({
      supplierName: "",
      description: "",
      contact: "",
      contactPerson: "",
    });
    setTempSupplierId(null);

    try {
      if (edittingSupplier) {
        // Include the supplier ID in the request body
        const updateData = {
          ...formData,
          _id: edittingSupplier._id,
        };
        await apiService.put(
          `/suppliers?id=${edittingSupplier._id}`,
          updateData
        );
      } else {
        const data: Supplier = await apiService.post("/suppliers", formData);
        setSuppliers((prevSuppliers: Supplier[]) =>
          prevSuppliers.map((s: Supplier) =>
            s._id === tempSupplierId
              ? {
                  ...s,
                  _id: data._id,
                }
              : s
          )
        );
      }
    } catch (error: any) {
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
        (s: Supplier) => s._id === supplierIdToDelete
      );
      setSuppliers((prevSuppliers: Supplier[]) =>
        prevSuppliers.filter((s: Supplier) => s._id !== supplierIdToDelete)
      );
      closeDeleteModal(); // Close modal immediately

      try {
        await apiService.delete(`/suppliers?id=${supplierIdToDelete}`);
        setError(null);
      } catch (error: any) {
        console.error("Error deleting supplier:", error);
        setSuppliers((prevSuppliers: Supplier[]) => [
          ...prevSuppliers,
          deletedSupplier!,
        ]);
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
      contact: supplier.contact || "",
      contactPerson: supplier.contactPerson || "",
    });
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = event.target;
    setFormData((prevFormData: FormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  return (
    <div className="supplier h-screen flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6">
      {error && <Toast message={error} onClose={() => setError(null)} />}

      {/* Search input */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Supplier Browser
          </h1>
          <i
            className="bx bxs-fire-alt text-xl sm:text-2xl"
            style={{ color: "#ff6300" }}
          ></i>
        </div>

        <input
          type="text"
          placeholder="Search Anything..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 md:w-72 lg:w-80 p-2 border rounded-lg bg-[#171717] border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Delete confirmation popup */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
          <div className="bg-[#171717] rounded-lg p-6 w-full max-w-md">
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

      <div className="mt-5 h-[40vh] overflow-y-auto " onScroll={handleScroll}>
        {loading ? (
          // Skeleton table while loading
          <div className="w-full">
            <table className="table-auto w-full">
              <thead className="sticky top-0 bg-transparent table-head">
                <tr>
                  <th className="py-2">Supplier name</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Contact numbers</th>
                  <th className="py-2">contact Person</th>
                  <th className="py-2">Last updated</th>
                  <th className="py-2">&nbsp;</th>
                </tr>
              </thead>
              <tbody id="supplier-table-body">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="select-none">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse w-3/4" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse w-5/6" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse w-2/3" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse w-1/2" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse w-1/3" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse w-6" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex justify-center items-center h-fulltext-gray-400">
            No suppliers available
          </div>
        ) : (
          <>
            <table className="table-auto w-full">
              <thead className="sticky top-0 bg-[#0f0f0f] table-head">
                <tr>
                  <th className="px-2 sm:px-4">Supplier name</th>
                  <th className="px-2 sm:px-4 hidden sm:table-cell">
                    Description
                  </th>
                  <th className="px-2 sm:px-4 hidden md:table-cell">Contact</th>
                  <th className="px-2 sm:px-4 hidden lg:table-cell">
                    Contact Person
                  </th>
                  <th className="px-2 sm:px-4 hidden xl:table-cell">
                    Last updated
                  </th>
                  <GrantWrapper allowedRoles={["admin"]}>
                    <th className="px-2 sm:px-4">Edit</th>
                  </GrantWrapper>
                </tr>
              </thead>
              <tbody id="supplier-table-body">
                {suppliers.map((supplier: Supplier) => (
                  <tr key={supplier._id}>
                    <td className="px-2 sm:px-4 py-2">
                      {supplier.supplierName}
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">
                      {supplier.description}
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
                      {supplier.contact}
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">
                      {supplier.contactPerson}
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden xl:table-cell">
                      {supplier.createdAt
                        ? supplier.createdAt.slice(0, 10)
                        : "N/A"}
                    </td>
                    <GrantWrapper allowedRoles={["admin"]}>
                      <td className="px-1 sm:px-2 py-2">
                        <i
                          className="bx bxs-pencil text-lg ms-2 sm:ms-5 edit cursor-pointer"
                          onClick={() => handleEdit(supplier)}
                        ></i>
                        <i
                          className="bx bxs-trash text-lg ms-1 delete cursor-pointer"
                          onClick={() => openDeleteModal(supplier._id)}
                        ></i>
                      </td>
                    </GrantWrapper>
                  </tr>
                ))}
              </tbody>
            </table>
            {loadingMore && (
              <div className="flex justify-center items-center py-4 gap-1">
                <div
                  className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex-shrink-0 mt-40">
        <div className="relative z-0 w-full mb-2 group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="supplierName"
                id="floating-supplier-name"
                className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2  appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0  peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.supplierName}
                required
              />
              <label
                htmlFor="floating-supplier-name"
                className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Supplier name
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="description"
                id="floating-description"
                className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0  peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.description}
              />
              <label
                htmlFor="floating-description"
                className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4  peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="contact"
                id="floating-contact-numbers"
                className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.contact}
              />
              <label
                htmlFor="floating-contact-numbers"
                className="peer-focus:font-medium absolute text-sm  text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4  peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Contact number
              </label>
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="contactPerson"
                id="floating-contactPerson"
                className="block py-2.5 px-0 w-full text-sm  bg-transparent border-0 border-b-2  appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0  peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.contactPerson}
              />
              <label
                htmlFor="floating-contactPerson"
                className="peer-focus:font-medium absolute text-sm  text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4  peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                contact Person
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <button
              type="button"
              className="w-full text-gray-300 bg-[#262626] focus:ring-2  font-medium rounded-lg text-sm px-5 py-2.5 mb-2 focus:outline-none focus:ring-blue-800"
              onClick={() => {
                setEdittingSupplier(null);
                setFormData({
                  supplierName: "",
                  description: "",
                  contact: "",
                  contactPerson: "",
                });
              }}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full text-[#303030] bg-white focus:ring-2  font-medium rounded-lg text-sm px-5 py-2.5 mb-2 focus:outline-none focus:ring-blue-800"
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
