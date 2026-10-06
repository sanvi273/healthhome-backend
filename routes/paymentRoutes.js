const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");

// ============================================================
// CREATE RAZORPAY ORDER
// Used for UPI, Cards, Net Banking, Wallets, etc.
// ============================================================

router.post(
  "/create-order",
  paymentController.createOrder
);

// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

router.post(
  "/verify-payment",
  paymentController.verifyPayment
);

// ============================================================
// RAZORPAY WEBHOOK
// ============================================================

router.post(
  "/webhook",
  paymentController.webhook
);

// ============================================================
// OLD QR ENDPOINTS
// Kept temporarily so older Flutter builds do not crash.
// New payment flow does NOT use these.
// ============================================================

router.get(
  "/qr-status/:paymentRecordId",
  paymentController.getQrPaymentStatus
);

router.post(
  "/close-qr",
  paymentController.closeQr
);

module.exports = router;