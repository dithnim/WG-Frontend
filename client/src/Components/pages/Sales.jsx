import React, { useEffect, useState } from "react";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [productList, setProductList] = useState([]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleQuantityChange = (event) => {
    setQuantity(Number(event.target.value));
  };

  const handleEditPrice = (index) => {
    setEditingIndex(index);
    setNewPrice(productList[index].sellingPrice);
  };

  const saveNewPrice = (index) => {
    setProductList((prevList) => {
      const updatedList = prevList.map((item, idx) => {
        if (idx === index) {
          const updatedPrice = parseFloat(newPrice) || item.sellingPrice;
          const isDiscounted = updatedPrice < item.sellingPrice;
          return {
            ...item,
            discountedPrice: updatedPrice,
            discount: isDiscounted ? item.sellingPrice - updatedPrice : 0,
          };
        }
        return item;
      });
      updateTotals(updatedList);
      return updatedList;
    });
    setEditingIndex(null);
    setNewPrice("");
  };

  const submitSale = async () => {
    try {
      const saleData = productList.map((product) => ({
        productName: product.productName,
        productId: product.productId,
        sellingPrice: product.sellingPrice,
        discountedPrice: product.discountedPrice,
        quantity: product.quantity,
        supplier: product.supplier,
      }));

      const response = await fetch("http://localhost:3000/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grandTotal: grandTotal, products: saleData }),
      });

      const data = await response.json();
      console.log("Sales created:", data);
    } catch (error) {
      console.error("Error creating sales:", error);
    }
  };

  const deleteProduct = (id) => {
    setProductList((prevList) =>
      prevList.filter((item) => item.productId !== id)
    );

    const deletedProduct = productList.find((item) => item.productId === id);
    if (deletedProduct) {
      const productTotal =
        deletedProduct.sellingPrice * deletedProduct.quantity;
      const discountAmount = deletedProduct.discount || 0;

      setSubTotal((prevSubTotal) => prevSubTotal - productTotal);
      setDiscount((prevDiscount) => prevDiscount - discountAmount);
      setGrandTotal(
        (prevGrandTotal) => prevGrandTotal - (productTotal - discountAmount)
      );
    }
  };

  const updateTotals = (updatedList) => {
    let newSubTotal = 0;
    let newDiscount = 0;

    updatedList.forEach((item) => {
      const priceToUse =
        item.discountedPrice !== undefined
          ? item.discountedPrice
          : item.sellingPrice;
      const productTotal = item.sellingPrice * item.quantity;
      newSubTotal += productTotal;
      newDiscount +=
        item.sellingPrice > priceToUse
          ? (item.sellingPrice - priceToUse) * item.quantity
          : 0;
    });

    setSubTotal(newSubTotal);
    setDiscount(newDiscount);
    setGrandTotal(newSubTotal - newDiscount);
  };

  const increaseQuantity = (index) => {
    setProductList((prevList) => {
      const updatedList = prevList.map((item, idx) =>
        idx === index ? { ...item, quantity: item.quantity + 1 } : item
      );
      updateTotals(updatedList);
      return updatedList;
    });
  };

  const decreaseQuantity = (index) => {
    setProductList((prevList) => {
      const updatedList = prevList.map((item, idx) =>
        idx === index && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      updateTotals(updatedList);
      return updatedList;
    });
  };

  const handleProductClick = (product) => {
    const productTotal = product.sellingPrice * quantity;
    const discountAmount = productTotal * 0.07;

    setSubTotal((prevSubTotal) => prevSubTotal + productTotal);
    setDiscount((prevDiscount) => prevDiscount + discountAmount);
    setGrandTotal(
      (prevGrandTotal) => prevGrandTotal + productTotal - discountAmount
    );

    setProductList((prevList) => [
      ...prevList,
      {
        productName: product.productName,
        productId: product.productId,
        sellingPrice: product.sellingPrice,
        discountedPrice: product.sellingPrice,
        quantity,
        supplier: product.supplier,
      },
    ]);

    if (document.getElementById("search-results"))
      document.getElementById("search-results").style.display = "none";
    setSearchQuery("");
    setQuantity(1); // Reset quantity to avoid accidental repeat additions
  };

  const fetchProducts = async () => {
    if (!searchQuery) {
      if (document.getElementById("search-results"))
        document.getElementById("search-results").style.display = "none";
      return;
    } else if (document.getElementById("search-results")) {
      document.getElementById("search-results").style.display = "block";
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/products?search=${searchQuery}`
      );
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  return (
    <div className="sales h-screen flex items-start justify-between p-12">
      <div className="flex flex-col mt-5 search">
        <div className="flex">
          <input
            type="text"
            placeholder="Search products..."
            id="product-search"
            className="rounded-s-xl px-6 py-2 font-semibold"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button
            className="flex items-center justify-center px-4 bg-transparent text-white rounded-e-xl py-[6px]"
            onClick={fetchProducts}
          >
            <i className="bx bx-search-alt-2 text-xl"></i>
          </button>

          <div className="flex ms-4 items-center">
            <label htmlFor="Quantity">Quantity</label>
            <input
              type="number"
              className="rounded-xl px-2 py-2 w-14 font-semibold ms-2"
              value={quantity}
              name="quantity"
              onChange={handleQuantityChange}
              min={0}
            />
          </div>
        </div>

        <div
          id="search-results"
          className="bg-[#171717] h-auto w-[40vw] mt-1 z-50 p-2 rounded-lg"
        >
          {loading ? (
            <p>Loading...</p>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product._id}
                className="leading-[30px] hover:bg-[#303030] rounded-md px-2 cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <label htmlFor="pname">
                  {product.productName} {"(" + product.productId + ")"}
                </label>
              </div>
            ))
          ) : (
            <div className="leading-[30px] hover:bg-[#303030] rounded-md px-2">
              <label htmlFor="pname">No results found...</label>
            </div>
          )}
        </div>

        <div
          className="bg-[#171717] h-[60vh] w-[45vw] top-[30vh] p-4 pb-6 pt-0 rounded-md absolute overflow-y-auto"
          id="product-list"
        >
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#171717]">
              <tr className="">
                <th className="px-1 py-4 text-center">#</th>
                <th className="px-1 py-4 text-center">Product Name</th>
                <th className="px-1 py-4 text-center">Product ID</th>
                <th className="px-1 py-4 text-center">Quantity</th>
                <th className="px-1 py-4 text-center">Selling Price</th>
                <th className="px-1 py-4 text-center">Supplier</th>
                <th className="px-1 py-4 text-center">Delete</th>
              </tr>
            </thead>

            <tbody>
              {productList.map((item, index) => (
                <tr key={index} className="product-list">
                  <td className="text-center border-b">{index + 1}</td>
                  <td className="text-center border-b">{item.productName}</td>
                  <td className="text-center border-b">{item.productId}</td>
                  <td className="text-center border-b">
                    <i
                      className="bx bx-minus-circle text-lg me-2"
                      onClick={() => decreaseQuantity(index)}
                    ></i>
                    {item.quantity}
                    <i
                      className="bx bx-plus-circle text-lg ms-2"
                      onClick={() => increaseQuantity(index)}
                    ></i>
                  </td>
                  <td className="text-center border-b">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        onChange={(e) => setNewPrice(e.target.value)}
                        onBlur={() => saveNewPrice(index)}
                        className="w-20 text-center"
                        value={newPrice}
                        autoFocus
                      />
                    ) : (
                      <>
                        Rs.
                        {item.discountedPrice !== undefined
                          ? item.discountedPrice
                          : item.sellingPrice}
                        <i
                          onClick={() => handleEditPrice(index)}
                          className="bx bxs-pencil ms-2 cursor-pointer"
                        ></i>
                      </>
                    )}
                  </td>
                  <td className="text-center border-b">{item.supplier}</td>
                  <td className="text-center border-b">
                    <i
                      className="bx bxs-trash text-lg ms-2 delete"
                      onClick={() => deleteProduct(item.productId)}
                    ></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-[30vw] ms-5 font-semibold ">
        <div className="cal-display w-full bg-[#171717] h-[25vh] rounded-lg p-3">
          <h1 className="mb-4">Sub Total: Rs.{subTotal.toFixed(2)}</h1>
          <h1 className="mb-10">Discount: Rs.{discount.toFixed(2)}</h1>
          <h1 className="text-2xl">Grand total: Rs.{grandTotal.toFixed(2)}</h1>
        </div>
        <div className="sale-manager w-full h-[53vh] mt-10 bg-[#171717] rounded-lg p-3">
          <div className="flex w-full justify-center">
            <button
              type="button"
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-10 py-2.5 me-2 mb-2 dark:bg-[#303030] dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              Recall
            </button>
            <button
              type="button"
              className="text-black bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-10 py-2.5 me-2 mb-2 dark:bg-white dark:hover:bg-[#dfdfdf] dark:focus:ring-gray-700 dark:border-gray-700"
              onClick={submitSale}
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
