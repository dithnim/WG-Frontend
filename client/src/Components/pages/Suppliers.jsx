import React, { useState, useEffect } from "react";
import apiService from "../../services/api";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [edittingSupplier, setEdittingSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // New state for form submission
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    supplierName: "",
    description: "",
    contactNumbers: "",
    email: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierIdToDelete, setSupplierIdToDelete] = useState(null);
  const [tempSupplierId, setTempSupplierId] = useState(null); // Added for temporary IDs

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get('/suppliers', { search: searchQuery });
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(error.message || "Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [searchQuery]);

  const openDeleteModal = (id) => {
    setSupplierIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSupplierIdToDelete(null);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      if (edittingSupplier) {
        const data = await apiService.put(`/suppliers`, formData, { id: edittingSupplier._id });
        setSuppliers(prevSuppliers => 
          prevSuppliers.map(s => 
            s._id === edittingSupplier._id ? { ...s, ...formData } : s
          )
        );
      } else {
        const data = await apiService.post('/suppliers', formData);
        setSuppliers(prevSuppliers => [...prevSuppliers, { ...formData, _id: data._id, updatedAt: data.data?.updatedAt }]);
      }

      // Reset form after success
      setEdittingSupplier(null);
      setFormData({
        supplierName: "",
        description: "",
        contactNumbers: "",
        email: "",
      });
      setTempSupplierId(null);
    } catch (error) {
      console.error("Error updating/adding Supplier:", error);
      setError(error.message || "Failed to save supplier. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    try {
      await apiService.delete('/suppliers', { id: supplierIdToDelete });
      setSuppliers((prevSuppliers) =>
        prevSuppliers.filter((supplier) => supplier._id !== supplierIdToDelete)
      );
      await fetchSuppliers(); // Ensure sync with server
    } catch (error) {
      console.error("Error deleting supplier:", error);
      setError(error.response?.data?.message || error.message || "Failed to delete supplier");
    } finally {
      closeDeleteModal();
    }
  };

  const handleEdit = (supplier) => {
    console.log("Editing supplier:", supplier);
    setEdittingSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName || "",
      description: supplier.description || "",
      contactNumbers: supplier.contactNumbers || "",
      email: supplier.email || "",
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  return (
    <div className="supplier h-screen p-12">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

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
                    {supplier.updatedAt ? supplier.updatedAt.slice(0, 10) : "N/A"}
                  </td>
                  <td className="px-1 py-2">
                    <i
                      className="bx bxs-pencil text-lg ms-5 edit"
                      onClick={() => handleEdit(supplier)}
                    ></i>
                    <i
                      className="bx bxs-trash text-lg ms-1 delete"
                      onClick={() => {
                        console.log(supplier._id);
                        openDeleteModal(supplier._id)
                      }}
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