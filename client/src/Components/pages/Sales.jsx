import React, { useEffect, useState } from "react";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [totalCost, setTotalCost] = useState(0);

  const [cashIn, setCashIn] = useState(0);
  const [change, setChange] = useState(0);
  const [profit, setProfit] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [newPrice, setNewPrice] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [productList, setProductList] = useState([]);

  const [showCashinModel, setShowCashinModel] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);

  const printBill = async () => {
    setIsPrinting(true);
    try{
      const response = await fetch("https://wg-backend-production-ad41.up.railway.app/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bill: billData }),
      });

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error printing bill:", error);
    }
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleEditPrice = (index) => {
    setEditingIndex(index);
    setNewPrice(productList[index].sellingPrice);

    const newDiscount = productList[index].discount || 0;
    setNewDiscount(newDiscount);

    setProfit(
      newDiscount > 0 ? productList[index].costPrice - newDiscount : profit
    );
  };

  const saveNewPrice = (index) => {
    setProductList((prevList) => {
      const updatedList = prevList.map((item, idx) => {
        if (idx === index) {
          const updatedPrice = parseFloat(newPrice) || item.sellingPrice;
          const updatedDiscount = parseFloat(newDiscount) || 0;
          const finalPrice = updatedPrice - updatedDiscount;
          return {
            ...item,
            discountedPrice: finalPrice,
            discount: updatedDiscount,
          };
        }
        return item;
      });
      updateTotals(updatedList);
      return updatedList;
    });
    setEditingIndex(null);
    setNewPrice("");
    setNewDiscount("");
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
        costPrice: product.costPrice,
      }));

      const response = await fetch("https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grandTotal: grandTotal, products: saleData }),
      });

      const data = await response.json();
      console.log("Sales created:", data);
      setIsPrinting(false);
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
      const deletedCost = deletedProduct.costPrice * deletedProduct.quantity;

      setSubTotal((prevSubTotal) => prevSubTotal - productTotal);
      setDiscount((prevDiscount) => prevDiscount - discountAmount);
      setGrandTotal(
        (prevGrandTotal) => prevGrandTotal - (productTotal - discountAmount)
      );
      setTotalCost((prevCost) => prevCost - deletedCost);

      setProfit(
        (prevProfit) =>
          prevProfit -
          (deletedProduct.sellingPrice - deletedProduct.costPrice) *
            deletedProduct.quantity
      );
    }
  };

  const updateTotals = (updatedList) => {
    let newSubTotal = 0;
    let newDiscount = 0;
    let newProfit = 0;

    updatedList.forEach((item) => {
      const productTotal = item.sellingPrice * item.quantity;
      const costTotal = item.costPrice * item.quantity;
      newSubTotal += productTotal;
      newDiscount += item.discount || 0;
      newProfit += (item.sellingPrice - item.costPrice) * item.quantity;
    });

    setSubTotal(newSubTotal);
    setDiscount(newDiscount);
    setGrandTotal(newSubTotal - newDiscount);
    setTotalCost((prevCost) =>
      updatedList.reduce((acc, item) => acc + item.costPrice * item.quantity, 0)
    );
    setProfit(newProfit);
  };

  const increaseQuantity = (index, maxQuantity) => {
    setProductList((prevList) => {
      const updatedList = prevList.map((item, idx) => {
        if (idx === index) {
          return item.quantity < maxQuantity
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        }
        return item;
      });
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
    const discountAmount = 0;

    setSubTotal((prevSubTotal) => prevSubTotal + productTotal);
    setDiscount((prevDiscount) => prevDiscount + discountAmount);
    setGrandTotal(
      (prevGrandTotal) => prevGrandTotal + productTotal - discountAmount
    );
    setTotalCost((prevCost) => prevCost + product.costPrice * quantity);

    setProfit(
      (prevProfit) =>
        prevProfit + (product.sellingPrice - product.costPrice) * quantity
    );

    setProductList((prevList) => [
      ...prevList,
      {
        productName: product.productName,
        productId: product.productId,
        sellingPrice: product.sellingPrice,
        discountedPrice: product.sellingPrice,
        discount: discountAmount,
        quantity,
        supplier: product.supplier,
        costPrice: product.costPrice,
        stock: product.stock,
      },
    ]);

    if (document.getElementById("search-results"))
      document.getElementById("search-results").style.display = "none";
    setSearchQuery("");
    setQuantity(1);
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
        `https://jlilvd91v5.execute-api.us-east-1.amazonaws.com/prod/products?search=${searchQuery}`
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
    // Cash In popup
    <div className="sales h-screen flex items-start justify-between p-12">
      {showCashinModel && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#171717] rounded-lg p-6 w-1/3">
            <h2 className="text-lg font-semibold mb-4">Cash In</h2>
            <input
              type="number"
              id="cashin"
              class="border border-gray-400 bg-transparent placeholder-gray-400 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
              placeholder="Enter cash ammount"
              onChange={(event) => {
                const val = parseFloat(event.target.value) || 0;
                setCashIn(val);
                const change = val - grandTotal;
                if (change > 0) {
                  setChange(change);
                }
              }}
            />
            <div className="mt-6 flex justify-end">
              <button
                className="text-white px-4 py-2 rounded-lg mr-2 hover:bg-[#5f5f5f]  border border-neutral-500/50 font-semibold cursor-pointer"
                onClick={() => setShowCashinModel(false)}
              >
                Close
              </button>
              <button className="text-white px-4 py-2 rounded-lg mr-2 hover:bg-red-600 bg-[#a10000]  border border-neutral-500/50 font-semibold cursor-pointer"
              onClick={() => {
                printBill();
                setShowCashinModel(false);
              }}
              >
                {isPrinting ? "Printing..." : "Print bill"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        </div>

        <div
          id="search-results"
          className="bg-[#171717] h-[15vh] w-[40vw] mt-1 z-50 p-2 rounded-lg overflow-y-auto"
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
                  {product.productId}
                  {" - "}
                  {product.productName}
                  {" - "}
                  {product.supplier}
                  {" - "}
                  {"[" + product.createdAt.slice(0, 10) + "]"}
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
          className="bg-[#171717] h-[60vh] w-[55vw] top-[32vh] p-4 pb-6 pt-0 rounded-md absolute overflow-y-auto"
          id="product-list"
        >
          <table className="w-full text-left" id="sales-table">
            <thead className="sticky top-0 bg-[#171717]">
              <tr className=" ">
                <th className="px-1 py-4 text-center">#</th>
                <th className="px-1 py-4 text-center">Product Name</th>
                <th className="px-1 py-4 text-center">Product ID</th>
                <th className="px-1 py-4 text-center">Quantity</th>
                <th className="px-1 py-4 text-center">Discount</th>
                <th className="px-1 py-4 text-center">Supplier</th>
                <th className="px-1 py-4 text-center">cost</th>
                <th className="px-1 py-4 text-center">Selling Price</th>
                <th className="px-1 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product, index) => (
                <tr key={product.productId}>
                  <td className="px-1 py-4 text-center">{index + 1}</td>
                  <td className="px-1 py-4 text-center">
                    {product.productName}
                  </td>
                  <td className="px-1 py-4 text-center">{product.productId}</td>
                  <td className="px-1 py-4 text-center">
                    <i
                      className="bx bx-minus-circle text-md cursor-pointer"
                      onClick={() => decreaseQuantity(index)}
                    ></i>
                    <span className="mx-2 text-center" max={product.stock}>
                      {product.quantity}
                    </span>
                    <i
                      className="bx bx-plus-circle text-md cursor-pointer"
                      onClick={() => {
                        const max = productList[index].stock;
                        increaseQuantity(index, max);
                      }}
                    ></i>
                  </td>
                  <td className="px-1 py-4 text-center">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(e.target.value)}
                        className="w-16 text-center"
                      />
                    ) : (
                      product.discount
                    )}
                  </td>
                  <td className="px-1 py-4 text-center">{product.supplier}</td>
                  <td className="px-1 py-4 text-center">{product.costPrice}</td>
                  <td className="px-1 py-4 text-center">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-16 text-center"
                      />
                    ) : (
                      product.sellingPrice
                    )}
                  </td>
                  <td className="px-1 py-4 text-center">
                    {editingIndex === index ? (
                      <>
                        <i
                          className="bx bx-save text-lg ms-5 edit"
                          onClick={() => saveNewPrice(index)}
                        ></i>

                        <i
                          className="bx bx-x text-lg  ms-1 edit"
                          onClick={() => setEditingIndex(null)}
                        ></i>
                      </>
                    ) : (
                      <>
                        <i
                          className="bx bxs-pencil text-lg ms-5 edit"
                          onClick={() => handleEditPrice(index)}
                        ></i>

                        <i
                          className="bx bxs-trash text-lg ms-1 delete"
                          onClick={() => deleteProduct(product.productId)}
                        ></i>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className=" w-[20vw] mt-5">
        <div className="checkout bg-[#171717] w-full p-8 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-white text-md font-semibold">Sub Total</p>
            <span className="text-white text-md font-semibold">
              {subTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between my-5">
            <p className="text-white text-md font-semibold">Discount</p>
            <span className="text-white text-md font-semibold">
              {discount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white text-md font-semibold">Grand Total</p>
            <span className="text-white text-md font-semibold">
              {grandTotal.toFixed(2)}
            </span>
          </div>
          <button
            className="bg-white w-full text-black font-bold py-3 rounded-xl mt-5 cursor-pointer"
            onClick={() => {
              setShowCashinModel(true);
            }}
          >
            Checkout
          </button>
        </div>

        <div className="bg-[#171717] w-full rounded-md mt-5 p-8">
          <div className="flex items-center justify-between">
            <p className="text-white text-md font-semibold">Cash In</p>
            <span className="text-white text-md font-semibold">
              {cashIn.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-5">
            <p className="text-white text-md font-semibold ">Change</p>
            <span className="text-md font-semibold">{change.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between mt-5">
            <p className="text-white text-md font-semibold">Profit</p>
            <span className="text-md font-semibold">{profit.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-[#171717] w-full rounded-md mt-5 px-8 py-2">
          <h2 className="text-white text-xl font-semibold">Bill browser</h2>
        </div>
      </div>
    </div>
  );
};

export default Sales;
