require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const multer = require("multer");
const path = require("path");
const employeeRoutes = require("./routes/employeeRoutes");


const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(v => v.trim()) : true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dukan API is running",
  });
});

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({ ok: true, database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/rice-mills", require("./routes/riceMillRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/contact-groups", require("./routes/contactGroupRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/employees", employeeRoutes);


app.use((err, req, res, next) => {
  console.error("[api]", err);
  if (err.code === 11000) return res.status(409).json({ message: "A record with that value already exists" });
  if (err.name === "ValidationError") return res.status(400).json({ message: "Please check the submitted fields" });
  res.status(500).json({ message: "Server error" });
});

const port = Number(process.env.PORT || 5000);
connectDB()
  .then(() => app.listen(port, () => console.log(`Smart Dalal API listening on ${port}`)))
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
