const express = require("express");

const router = express.Router();

const {
  placeOrder,
  getPharmacyOrders,
  getPatientOrders,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/orderController");

console.log("✅ orderRoutes.js loaded");

// ============================================================
// TEST
// ============================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order routes working",
  });
});

// ============================================================
// PLACE MEDICINE ORDER
// POST /api/orders/place
// ============================================================

router.post(
  "/place",
  placeOrder
);

// ============================================================
// GET ALL ORDERS
// GET /api/orders/all
// ============================================================

router.get(
  "/all",
  getAllOrders
);

// ============================================================
// PHARMACY ORDERS
// GET /api/orders/pharmacy/:pharmacyId
// ============================================================

router.get(
  "/pharmacy/:pharmacyId",
  getPharmacyOrders
);

// ============================================================
// PATIENT ORDERS
// GET /api/orders/patient/:phone
// ============================================================

router.get(
  "/patient/:phone",
  getPatientOrders
);

// ============================================================
// UPDATE ORDER STATUS
// PUT /api/orders/status/:id
// ============================================================

router.put(
  "/status/:id",
  updateOrderStatus
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;