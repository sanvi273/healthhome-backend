const express = require("express");

const router = express.Router();

const {
  placeOrder,
  getPharmacyOrders,
  getPatientOrders,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/orderController");


// =============================
// Place Medicine Order
// =============================
router.post("/place", placeOrder);


// =============================
// Get All Orders (Admin)
// =============================
router.get("/all", getAllOrders);


// =============================
// Pharmacy Orders
// =============================
router.get("/pharmacy/:pharmacyId", getPharmacyOrders);


// =============================
// Patient Orders
// =============================
router.get("/patient/:phone", getPatientOrders);


// =============================
// Update Order Status
// =============================
router.put("/status/:id", updateOrderStatus);


module.exports = router;