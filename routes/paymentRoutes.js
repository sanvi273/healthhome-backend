const express = require("express");

const router = express.Router();

const {
  createOrder,
  verifyPayment,
} = require("../controllers/paymentController");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Payment Route Working",
  });
});

router.post("/create-order", createOrder);

router.post("/verify-payment", verifyPayment);

module.exports = router;