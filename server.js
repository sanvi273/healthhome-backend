console.log("THIS IS MY REAL SERVER");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ================= IMPORT ROUTES =================

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const labRoutes = require("./routes/labRoutes");
const pharmacyRoutes = require("./routes/pharmacyRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const labOrderRoutes = require("./routes/labOrderRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ================= APP =================

const app = express();

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());

// ================= ROUTES =================

app.use("/api/auth", authRoutes);

app.use("/api/doctors", doctorRoutes);

app.use("/api/labs", labRoutes);

app.use("/api/pharmacies", pharmacyRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/medicines", medicineRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

console.log("Cart Routes Loaded Successfully");
console.log(cartRoutes);

app.use("/api/lab-orders", labOrderRoutes);

console.log("Mounting prescription routes...");
app.use("/api/prescriptions", prescriptionRoutes);
console.log("Prescription routes mounted.");

console.log("Mounting payment routes...");
app.use("/api/payment", paymentRoutes);
console.log("Payment routes mounted.");

// ================= TEST ROUTE =================

app.get("/", (req, res) => {
  res.send("HealthHome Backend Running");
});

// ================= MONGODB =================

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });

// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});