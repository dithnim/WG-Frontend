import React from "react";
import { useState, useEffect } from "react";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [edittingSupplier, setEdittingSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    description: "",
    contactNumbers: "",
    email: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierIdToDelete, setSupplierIdToDelete] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/suppliers?search=${searchQuery}`
      );
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openDeleteModal = (id) => {
    setSupplierIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSupplierIdToDelete(null);
  };

  const handleSubmit = async () => {
    try {
      const method = edittingSupplier ? "PUT" : "POST";
      const url = edittingSupplier
        ? `http://localhost:3000/suppliers/${edittingSupplier._id}`
        : "http://localhost:3000/suppliers";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      fetchSuppliers();
      setEdittingSupplier(null);
      setFormData({
        supplierName: "",
        description: "",
        contactNumbers: "",
        email: "",
      });
    } catch (error) {
      console.error("Error updating/adding Supplier:", error);
    }
  };

  const confirmDeleteProduct = async () => {
    if (supplierIdToDelete) {
      try {
        const response = await fetch(
          `http://localhost:3000/suppliers/${supplierIdToDelete}`,
          {
            method: "DELETE",
          }
        );
        const data = await response.json();
        console.log(data);
        fetchSuppliers();
      } catch (error) {
        console.error("Error deleting product:", error);
      } finally {
        closeDeleteModal();
      }
    }
  };

  const handleEdit = (supplier) => {
    setEdittingSupplier(supplier);
    setFormData(supplier);
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
                <td className="px-4 py-2">{supplier.updatedAt.slice(0, 10)}</td>
                <td className="px-1 py-2">
                  <i
                    className="bx bxs-pencil text-lg ms-5 edit"
                    onClick={() => handleEdit(supplier)}
                  ></i>
                  <i
                    className="bx bxs-trash text-lg ms-1 delete"
                    onClick={() => openDeleteModal(supplier._id)}
                  ></i>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-auto px-2 py-2 mt-5">
        <div className="relative z-0 w-full mb-5 group">
          <div class="grid md:grid-cols-2 md:gap-6">
            <div class="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="supplierName"
                id="floating-supplier-name"
                class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.supplierName}
                required
              />
              <label
                for="floating-supplier-name"
                class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Supplier name
              </label>
            </div>
            <div class="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="description"
                id="floating-description"
                class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.description}
                required
              />
              <label
                for="floating-description"
                class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Description
              </label>
            </div>
          </div>

          <div class="grid md:grid-cols-2 md:gap-6">
            <div class="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="contactNumbers"
                id="floating-cost"
                class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.contactNumbers}
                required
              />
              <label
                for="floating-cost"
                class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Contact numbers
              </label>
            </div>
            <div class="relative z-0 w-full mb-5 group">
              <input
                type="email"
                name="email"
                id="floating-selling-price"
                class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                onChange={handleInputChange}
                value={formData.email}
                required
              />
              <label
                for="floating-selling-price"
                class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Email
              </label>
            </div>
          </div>

          <div class="grid md:grid-cols-2 md:gap-6">
            <button
              type="button"
              class="w-full text-gray-300 bg-[#262626]  focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2   focus:outline-none dark:focus:ring-blue-800"
              onClick={() => {
                setEdittingSupplier(null);
                setFormData({
                  supplierName: "",
                  description: "",
                  contactNumbers: "",
                  email: "",
                });
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              class="w-full text-[#303030] bg-white  focus:ring-2 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2   focus:outline-none dark:focus:ring-blue-800"
            >
              {edittingSupplier ? "Update supplier" : "Add supplier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
