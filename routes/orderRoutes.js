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

  verifyDeliveryOtp,

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

router.post("/place", placeOrder);

// ============================================================
// PRESCRIPTION IMAGE ORDER
// ============================================================

router.post("/prescription", placePrescriptionOrder);

// ============================================================
// CONFIRM PRESCRIPTION ORDER
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
// VERIFY DELIVERY OTP
// ============================================================
//
// Delivery flow:
//
// Accepted
//    ↓
// Packed
//    ↓
// Out for Delivery
//    ↓
// Patient gives OTP
//    ↓
// Delivery partner verifies OTP
//    ↓
// Delivered
//
// ============================================================

router.put(

  "/delivery-otp/:id",

  verifyDeliveryOtp

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