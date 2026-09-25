const express = require("express");

const router = express.Router();

const {
  placeOrder,
  getPharmacyOrders,
  getPatientOrders,
  updateOrderStatus,
  assignDeliveryAgent,
  removeDeliveryAgent,
  collectCODPayment,
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
//
// Example:
// {
//   "status": "Accepted"
// }
//
// Other statuses:
// Pending
// Accepted
// Packed
// Out for Delivery
// Delivered
// Rejected
// Cancelled
//
// ============================================================

router.put(
  "/status/:id",
  updateOrderStatus
);

// ============================================================
// ASSIGN DELIVERY PARTNER
// PUT /api/orders/delivery-agent/:id
// ============================================================
//
// Request body:
//
// {
//   "deliveryAgentName": "Rahul Patel",
//   "deliveryAgentPhone": "9876543210"
// }
//
// ============================================================

router.put(
  "/delivery-agent/:id",
  assignDeliveryAgent
);

// ============================================================
// REMOVE / CHANGE DELIVERY PARTNER
// PUT /api/orders/delivery-agent/remove/:id
// ============================================================
//
// This removes the currently assigned delivery partner.
//
// ============================================================

router.put(
  "/delivery-agent/remove/:id",
  removeDeliveryAgent
);

// ============================================================
// COLLECT COD PAYMENT
//
// PUT /api/orders/cod/collect/:id
//
// This is used when the delivery/cash collection is completed.
// ============================================================

router.put(
  "/cod/collect/:id",
  collectCODPayment
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;