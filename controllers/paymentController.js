const Razorpay = require("razorpay");

const crypto = require("crypto");

const Payment = require("../models/Payment");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================
// CREATE PAYMENT ORDER
// ==========================
exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
    } = req.body;

    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================
// VERIFY PAYMENT
// ==========================
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      amount,
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
      paymentMethod,
    } = req.body;

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          razorpay_order_id +
            "|" +
            razorpay_payment_id
        )
        .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment Verification Failed",
      });
    }

    const payment = new Payment({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,

      amount,

      userId,
      userName,
      userPhone,

      serviceType,
      serviceId,

      paymentMethod,

      status: "Success",
    });

    await payment.save();

    res.json({
      success: true,
      message: "Payment Successful",
      payment,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};