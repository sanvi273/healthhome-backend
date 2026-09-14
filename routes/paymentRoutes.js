const express = require("express");

const router = express.Router();

const {
  createOrder,
  verifyPayment,
  webhook,
} = require("../controllers/paymentController");

console.log("✅ paymentRoutes.js loaded");

// ============================================================
// TEST PAYMENT ROUTE
//
// GET /api/payment/test
// ============================================================

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Payment Route Working",
  });
});

// ============================================================
// CREATE RAZORPAY ORDER
//
// POST /api/payment/create-order
//
// This creates the Razorpay order using the amount
// already calculated and stored in the HealthHome Order.
// ============================================================

router.post(
  "/create-order",
  createOrder
);

// ============================================================
// VERIFY RAZORPAY PAYMENT
//
// POST /api/payment/verify-payment
//
// This verifies:
// - Razorpay order ID
// - Razorpay payment ID
// - Razorpay signature
// - Payment amount
// - Payment capture status
// ============================================================

router.post(
  "/verify-payment",
  verifyPayment
);

// ============================================================
// RAZORPAY WEBHOOK
//
// POST /api/payment/webhook
//
// Razorpay sends payment events here.
//
// IMPORTANT:
// server.js must use express.raw() for this endpoint
// BEFORE express.json().
//
// The webhook function is implemented in:
// controllers/paymentController.js
// ============================================================

router.post(
  "/webhook",
  webhook
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;