const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");

// ============================================================
// CREATE UPI QR PAYMENT
// ============================================================

router.post(
  "/create-order",
  paymentController.createOrder
);

// ============================================================
// VERIFY UPI QR PAYMENT
// ============================================================

router.post(
  "/verify-payment",
  paymentController.verifyPayment
);

// ============================================================
// GET QR PAYMENT STATUS
//
// Used by Flutter to check whether the patient has completed
// the UPI payment.
// ============================================================

router.get(
  "/qr-status/:paymentRecordId",
  paymentController.getQrPaymentStatus
);

// ============================================================
// CLOSE QR
//
// Used when the user cancels/leaves the payment screen.
// ============================================================

router.post(
  "/close-qr",
  paymentController.closeQr
);

// ============================================================
// RAZORPAY WEBHOOK
// ============================================================

router.post(
  "/webhook",
  paymentController.webhook
);

module.exports = router;