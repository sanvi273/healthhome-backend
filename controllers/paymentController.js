const Razorpay = require("razorpay");
const crypto = require("crypto");

const Payment = require("../models/Payment");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================

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

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    if (!userId || !serviceType || !serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "userId, serviceType and serviceId are required",
      });
    }

    // --------------------------------------------------------
    // AMOUNT IN PAISE
    // --------------------------------------------------------

    const amountInPaise = Math.round(
      Number(amount) * 100
    );

    // --------------------------------------------------------
    // RECEIPT
    // --------------------------------------------------------

    const receipt =
      `healthhome_${serviceType.toLowerCase()}_${Date.now()}`;

    // --------------------------------------------------------
    // CREATE RAZORPAY ORDER
    // --------------------------------------------------------

    const order =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          userId: String(userId),
          userPhone: String(userPhone || ""),
          serviceType: String(serviceType),
          serviceId: String(serviceId),
        },
      });

    console.log(
      "RAZORPAY ORDER CREATED:",
      order.id
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      key: process.env.RAZORPAY_KEY_ID,

      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },

      payment: {
        amount: Number(amount),
        userId,
        userName,
        userPhone,
        serviceType,
        serviceId,
      },
    });

  } catch (error) {

    console.error(
      "CREATE RAZORPAY ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create Razorpay order",
    });
  }
};


// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================

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

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment information is incomplete",
      });
    }

    // --------------------------------------------------------
    // GENERATE SIGNATURE
    // --------------------------------------------------------

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    // --------------------------------------------------------
    // VERIFY SIGNATURE
    // --------------------------------------------------------

    if (
      generatedSignature !==
      razorpay_signature
    ) {

      console.error(
        "RAZORPAY SIGNATURE VERIFICATION FAILED"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed",
      });
    }

    // --------------------------------------------------------
    // PREVENT DUPLICATE PAYMENT RECORD
    // --------------------------------------------------------

    const existingPayment =
      await Payment.findOne({
        paymentId:
          razorpay_payment_id,
      });

    if (existingPayment) {

      return res.status(200).json({
        success: true,
        message:
          "Payment already verified",
        payment: existingPayment,
      });
    }

    // --------------------------------------------------------
    // SAVE PAYMENT
    // --------------------------------------------------------

    const payment =
      await Payment.create({

        paymentId:
          razorpay_payment_id,

        orderId:
          razorpay_order_id,

        signature:
          razorpay_signature,

        amount:
          Number(amount),

        userId,

        userName,

        userPhone,

        serviceType,

        serviceId,

        paymentMethod:
          paymentMethod || "UPI",

        status:
          "Success",
      });

    console.log(
      "PAYMENT VERIFIED:",
      payment._id
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Payment verified successfully",

      payment,
    });

  } catch (error) {

    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Payment verification failed",
    });
  }
};