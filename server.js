import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";

const mongoURI =
  "mongodb+srv://nimsaradineth53:DN123@cluster0.gxgqb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(cors());

app.use("/products", productRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/sales", saleRoutes);

app.get("/", (req, res) => {
  const data = {
    name: "User",
    activities: [
      "product Management",
      "Sales Management",
      "Supplier Management",
      "And more...",
    ],
  };
  res.render("index", data);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
