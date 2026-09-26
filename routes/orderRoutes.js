const express = require("express");

const router = express.Router();

const {
  placeOrder,
  placePrescriptionOrder,
  confirmPrescriptionOrder,
  getPharmacyOrders,
  getPatientOrders,
  updateOrderStatus,
  assignDeliveryAgent,
  removeDeliveryAgent,
  collectCODPayment,
  getAllOrders,
} = require("../controllers/orderController");

// ============================================================
// TEST
// ============================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order API working",
  });
});

// ============================================================
// NORMAL MEDICINE ORDER
// ============================================================
//
// Patient selects medicines
//        ↓
// Backend verifies medicine prices
//        ↓
// Creates MEDICINE order
//
// ============================================================

router.post("/place", placeOrder);

// ============================================================
// PRESCRIPTION IMAGE ORDER
// ============================================================
//
// Patient uploads prescription
//        ↓
// Creates PRESCRIPTION order
//        ↓
// Initial amount = ₹0
//        ↓
// Pharmacy confirms medicines
//
// ============================================================

router.post("/prescription", placePrescriptionOrder);

// ============================================================
// CONFIRM PRESCRIPTION ORDER
// ============================================================
//
// Pharmacy checks prescription
//        ↓
// Selects medicines
//        ↓
// Backend gets real prices from MongoDB
//        ↓
// Calculates final amount
//        ↓
// Order becomes Accepted
//
// ============================================================

router.put(
  "/prescription/confirm/:id",
  confirmPrescriptionOrder
);

// ============================================================
// GET ALL ORDERS
// ============================================================

router.get("/all", getAllOrders);

// ============================================================
// GET PHARMACY ORDERS
// ============================================================

router.get(
  "/pharmacy/:pharmacyId",
  getPharmacyOrders
);

// ============================================================
// GET PATIENT ORDERS
// ============================================================

router.get(
  "/patient/:phone",
  getPatientOrders
);

// ============================================================
// UPDATE ORDER STATUS
// ============================================================
//
// Pending
// Accepted
// Packed
// Out for Delivery
// Delivered
// Rejected
//
// ============================================================

router.put(
  "/status/:id",
  updateOrderStatus
);

// ============================================================
// ASSIGN DELIVERY PARTNER
// ============================================================

router.put(
  "/delivery-agent/:id",
  assignDeliveryAgent
);

// ============================================================
// REMOVE DELIVERY PARTNER
// ============================================================

router.put(
  "/delivery-agent/remove/:id",
  removeDeliveryAgent
);

// ============================================================
// COLLECT COD PAYMENT
// ============================================================

router.put(
  "/cod/collect/:id",
  collectCODPayment
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;