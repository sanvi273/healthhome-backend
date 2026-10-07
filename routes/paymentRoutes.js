const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const upload = require("../middleware/upload");

// Existing Medicine/Lab payment flow
router.post("/create-order", paymentController.createOrder);
router.post("/verify-payment", paymentController.verifyPayment);

// Doctor appointment payment flow
// Selected reports are uploaded with the pending appointment.
router.post(
  "/create-doctor-order",
  upload.array("reports"),
  paymentController.createDoctorOrder
);

router.post("/verify-doctor-payment", paymentController.verifyDoctorPayment);
router.post("/cancel-doctor-order", paymentController.cancelDoctorOrder);

// Razorpay webhook
router.post("/webhook", paymentController.webhook);

// Old QR compatibility endpoints
router.get("/qr-status/:paymentRecordId", paymentController.getQrPaymentStatus);
router.post("/close-qr", paymentController.closeQr);

module.exports = router;
