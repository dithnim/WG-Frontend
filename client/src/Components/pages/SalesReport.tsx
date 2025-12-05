import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import apiService from "../../services/api";
import { format } from "date-fns";
import Spinner from "../Spinner";

interface Supplier {
  _id: string;
  supplierName: string;
}

interface SaleItem {
  invoiceId: string;
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  subTotal: number;
  saleDate: string;
}

interface ReportData {
  sales: SaleItem[];
  supplierName: string;
  totalQuantity: number;
  totalRevenue: number;
}

const SalesReport: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<SaleItem[]>([]);

  // Report header editable fields
  const [reportTitle, setReportTitle] = useState<string>("Sales Report");
  const [companyName, setCompanyName] = useState<string>("WG Shop");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    setDownloading(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Calculate if we need multiple pages
      const scaledHeight = imgHeight * ratio;

      if (scaledHeight <= pdfHeight - 20) {
        // Single page
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          scaledHeight
        );
      } else {
        // Multiple pages
        let remainingHeight = imgHeight;
        let position = 0;
        const pageHeight = (pdfHeight - 20) / ratio;

        while (remainingHeight > 0) {
          pdf.addImage(
            imgData,
            "PNG",
            imgX,
            imgY - position * ratio,
            imgWidth * ratio,
            imgHeight * ratio
          );

          remainingHeight -= pageHeight;
          position += pageHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      const fileName = `Sales_Report_${reportData?.supplierName || "Supplier"}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const data = await apiService.get("/suppliers");
        if (Array.isArray(data)) {
          setSuppliers(data);
        }
      } catch (err: any) {
        console.error("Error fetching suppliers:", err);
        setError("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch report data when supplier is selected
  const fetchReport = async () => {
    if (!selectedSupplier) {
      setError("Please select a supplier");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = { supplierId: selectedSupplier };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await apiService.get("/sales/report/supplier", params);
      setReportData(data);
      setEditedData(data.sales || []);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setError(err.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a cell
  const handleCellEdit = (
    index: number,
    field: keyof SaleItem,
    value: string | number
  ) => {
    const updated = [...editedData];
    (updated[index] as any)[field] = value;

    // Recalculate subTotal if quantity or sellingPrice changed
    if (field === "quantity" || field === "sellingPrice") {
      updated[index].subTotal =
        Number(updated[index].quantity) * Number(updated[index].sellingPrice);
    }

    setEditedData(updated);
  };

  // Calculate totals from edited data
  const calculateTotals = () => {
    const totalQuantity = editedData.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );
    const totalRevenue = editedData.reduce(
      (sum, item) => sum + Number(item.subTotal),
      0
    );
    return { totalQuantity, totalRevenue };
  };

  const totals = editedData.length > 0 ? calculateTotals() : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
            }}
          >
            Supplier Sales Report
          </h1>
          <p className="text-gray-400">
            Select a supplier to view their sold items report
          </p>
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Supplier *
              </label>
              {loadingSuppliers ? (
                <div className="flex items-center justify-center h-10">
                  <Spinner />
                </div>
              ) : (
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full text-white rounded-lg px-4 py-2.5 focus:outline-none transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.supplierName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-white rounded-lg px-4 py-2.5 focus:outline-none transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-white rounded-lg px-4 py-2.5 focus:outline-none transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #171717 0%, #0d0d0d 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                }}
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={loading || !selectedSupplier}
                className="w-full text-white font-medium rounded-lg px-4 py-2.5 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.1)",
                }}
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="rounded-lg p-4 mb-6"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              boxShadow: "0 0 15px rgba(239, 68, 68, 0.1)",
            }}
          >
            {error}
          </div>
        )}

        {/* Report Section */}
        {reportData && (
          <div
            className="rounded-xl p-6"
            style={{
              background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => {
                  setEditedData(reportData.sales || []);
                  setReportTitle("Sales Report");
                  setCompanyName("WG Shop");
                  setAdditionalNotes("");
                }}
                className="text-white font-medium rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.2) 100%)",
                  border: "1px solid rgba(234, 179, 8, 0.4)",
                  boxShadow: "0 0 10px rgba(234, 179, 8, 0.15)",
                  color: "#fbbf24",
                }}
              >
                Reset Changes
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="font-medium rounded-lg px-4 py-2 transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(126, 34, 206, 0.2) 100%)",
                  border: "1px solid rgba(147, 51, 234, 0.4)",
                  boxShadow: "0 0 10px rgba(147, 51, 234, 0.15)",
                  color: "#a78bfa",
                }}
              >
                {downloading ? (
                  <Spinner />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                {downloading ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              💡 Tip: Click on any field in the report below to edit it
              directly. Changes will be included in the downloaded PDF.
            </p>

            {/* Printable Report */}
            <div
              ref={printRef}
              className="bg-white text-black p-8 rounded-lg print:p-4"
            >
              {/* Report Header */}
              <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-2xl font-bold text-center w-full bg-transparent border-none focus:outline-none focus:bg-gray-100 rounded px-2"
                />
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="text-xl font-semibold mt-2 text-center w-full bg-transparent border-none focus:outline-none focus:bg-gray-100 rounded px-2"
                />
                <p className="text-gray-600 mt-2">
                  Supplier: <strong>{reportData.supplierName}</strong>
                </p>
                <p className="text-gray-600">
                  Generated on: {format(new Date(), "MMMM dd, yyyy HH:mm")}
                </p>
                {(startDate || endDate) && (
                  <p className="text-gray-600">
                    Period: {startDate || "Beginning"} to {endDate || "Present"}
                  </p>
                )}
              </div>

              {/* Sales Table */}
              {editedData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          #
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Invoice ID
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Product ID
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Product Name
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right">
                          Quantity
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right">
                          Unit Price
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right">
                          Subtotal
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedData.map((item, index) => (
                        <tr key={`${item.invoiceId}-${index}`}>
                          <td className="border border-gray-300 px-4 py-2">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <input
                              type="text"
                              value={item.invoiceId}
                              onChange={(e) =>
                                handleCellEdit(
                                  index,
                                  "invoiceId",
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent px-2 py-1 rounded border-none focus:outline-none focus:bg-gray-100"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-mono text-sm">
                            <input
                              type="text"
                              value={item.productId}
                              onChange={(e) =>
                                handleCellEdit(
                                  index,
                                  "productId",
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent px-2 py-1 rounded border-none focus:outline-none focus:bg-gray-100 font-mono text-sm"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) =>
                                handleCellEdit(
                                  index,
                                  "productName",
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent px-2 py-1 rounded border-none focus:outline-none focus:bg-gray-100"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleCellEdit(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full bg-transparent px-2 py-1 rounded border-none focus:outline-none focus:bg-gray-100 text-right"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) =>
                                handleCellEdit(
                                  index,
                                  "sellingPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-transparent px-2 py-1 rounded border-none focus:outline-none focus:bg-gray-100 text-right"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                            Rs. {item.subTotal.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <input
                              type="date"
                              value={format(
                                new Date(item.saleDate),
                                "yyyy-MM-dd"
                              )}
                              onChange={(e) =>
                                handleCellEdit(
                                  index,
                                  "saleDate",
                                  e.target.value
                                )
                              }
                              className="w-full bg-transparent px-2 py-1 rounded border-none focus:outline-none focus:bg-gray-100"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td
                          colSpan={4}
                          className="border border-gray-300 px-4 py-2 text-right"
                        >
                          TOTALS:
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {totals?.totalQuantity || 0}
                        </td>
                        <td className="border border-gray-300 px-4 py-2"></td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          Rs. {(totals?.totalRevenue || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No sales data found for this supplier.
                </div>
              )}

              {/* Summary */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Total Items Sold:</span>
                    <span className="font-bold ml-2">
                      {totals?.totalQuantity || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-bold ml-2">
                      Rs. {(totals?.totalRevenue || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                <h4 className="font-semibold mb-1">Notes:</h4>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Click here to add notes..."
                  className="w-full bg-transparent border-none focus:outline-none focus:bg-gray-100 rounded px-2 py-1 min-h-[60px] resize-y text-gray-600"
                />
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center text-gray-500 text-sm">
                <p>This is a computer-generated report.</p>
                <p>
                  © {new Date().getFullYear()} {companyName}. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!reportData && !loading && (
          <div
            className="rounded-xl p-12 text-center"
            style={{
              background: "linear-gradient(135deg, #0d0d0d 0%, #171717 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            <svg
              className="w-16 h-16 mx-auto text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Report Generated
            </h3>
            <p className="text-gray-500">
              Select a supplier and click "Generate Report" to view sales data.
            </p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesReport;
