const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");

// ============================================================
// NORMAL PAYMENT APIs
// ============================================================

router.post(
  "/create-order",
  paymentController.createOrder
);

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

module.exports = router;