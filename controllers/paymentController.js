const Razorpay = require("razorpay");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/orderModel");

// ============================================================
// RAZORPAY CONFIGURATION
// ============================================================

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId) {
  console.error("❌ RAZORPAY_KEY_ID is missing.");
}

if (!razorpayKeySecret) {
  console.error("❌ RAZORPAY_KEY_SECRET is missing.");
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// ============================================================
// HELPER - CHECK RAZORPAY CONFIGURATION
// ============================================================

const checkRazorpayConfiguration = () => {
  if (!razorpayKeyId || !razorpayKeySecret) {
    return {
      success: false,
      message:
        "Razorpay credentials are not configured on the server.",
    };
  }

  return {
    success: true,
  };
};

// ============================================================
// HELPER - FORMAT RAZORPAY ERROR
// ============================================================

const getRazorpayErrorDetails = (error) => {
  return {
    message: error?.message || "",
    description: error?.error?.description || "",
    code: error?.error?.code || "",
    field: error?.error?.field || "",
    source: error?.error?.source || "",
    step: error?.error?.step || "",
    reason: error?.error?.reason || "",
    statusCode: error?.statusCode || "",
  };
};

// ============================================================
// CREATE RAZORPAY ORDER
//
// POST /api/payment/create-order
//
// IMPORTANT:
// Amount is ALWAYS taken from the HealthHome Order.
// Flutter cannot decide the payment amount.
// ============================================================

exports.createOrder = async (req, res) => {
  try {
    console.log("");
    console.log("==============================================");
    console.log("CREATE RAZORPAY ORDER");
    console.log("==============================================");

    const {
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
    } = req.body;

    console.log("USER ID =", userId);
    console.log("USER NAME =", userName);
    console.log("USER PHONE =", userPhone);
    console.log("SERVICE TYPE =", serviceType);
    console.log("SERVICE ID =", serviceId);

    // ==========================================================
    // CHECK RAZORPAY CONFIGURATION
    // ==========================================================

    const razorpayConfig = checkRazorpayConfiguration();

    if (!razorpayConfig.success) {
      console.error(
        "❌ RAZORPAY CONFIGURATION ERROR:",
        razorpayConfig.message
      );

      return res.status(500).json({
        success: false,
        message: razorpayConfig.message,
      });
    }

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!serviceType || !serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "serviceType and serviceId are required.",
      });
    }

    // ==========================================================
    // MEDICINE / PHARMACY PAYMENT
    // ==========================================================

    if (serviceType !== "Medicine") {
      return res.status(400).json({
        success: false,
        message:
          "Only Medicine payment is enabled in the current payment flow.",
      });
    }

    // ==========================================================
    // FIND HEALTHHOME ORDER
    // ==========================================================

    const order = await Order.findById(serviceId);

    if (!order) {
      console.error(
        "❌ HEALTHHOME ORDER NOT FOUND:",
        serviceId
      );

      return res.status(404).json({
        success: false,
        message: "Medicine order not found.",
      });
    }

    console.log("HEALTHHOME ORDER FOUND");
    console.log("ORDER ID =", order._id);
    console.log("ORDER TOTAL =", order.totalAmount);
    console.log("PAYMENT METHOD =", order.paymentMethod);
    console.log("PAYMENT STATUS =", order.paymentStatus);

    // ==========================================================
    // ONLY ONLINE ORDERS CAN USE RAZORPAY
    // ==========================================================

    if (order.paymentMethod !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay can only be used for ONLINE orders.",
      });
    }

    // ==========================================================
    // PREVENT DUPLICATE PAYMENT
    // ==========================================================

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid.",
      });
    }

    // ==========================================================
    // GET SECURE AMOUNT FROM DATABASE
    // ==========================================================

    const amount = Number(order.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      console.error(
        "❌ INVALID HEALTHHOME ORDER AMOUNT:",
        order.totalAmount
      );

      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    // ==========================================================
    // RAZORPAY AMOUNT
    //
    // HealthHome: ₹213
    // Razorpay: 21300 paise
    // ==========================================================

    const amountInPaise = Math.round(amount * 100);

    if (
      !Number.isInteger(amountInPaise) ||
      amountInPaise <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment amount.",
      });
    }

    console.log("HEALTHHOME AMOUNT =", amount);
    console.log("RAZORPAY AMOUNT PAISE =", amountInPaise);

    // ==========================================================
    // RAZORPAY RECEIPT
    // ==========================================================

    const receipt = `HH_${Date.now()}`;

    console.log("RAZORPAY RECEIPT =", receipt);

    // ==========================================================
    // CREATE RAZORPAY ORDER
    // ==========================================================

    let razorpayOrder;

    try {
      console.log("");
      console.log("---------- RAZORPAY API REQUEST ----------");
      console.log("AMOUNT =", amountInPaise);
      console.log("CURRENCY = INR");
      console.log("RECEIPT =", receipt);
      console.log("-------------------------------------------");

      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt,

        notes: {
          healthhomeOrderId: String(order._id),

          patientId: String(
            order.patientId || userId || ""
          ),

          patientPhone: String(
            order.patientPhone || userPhone || ""
          ),

          pharmacyId: String(
            order.pharmacyId || ""
          ),

          pharmacyName: String(
            order.pharmacyName || ""
          ),

          serviceType: "Medicine",
        },
      });

      console.log("");
      console.log("✅ RAZORPAY ORDER CREATED");
      console.log("RAZORPAY ORDER ID =", razorpayOrder.id);
      console.log("RAZORPAY AMOUNT =", razorpayOrder.amount);
      console.log("RAZORPAY CURRENCY =", razorpayOrder.currency);
      console.log("");
    } catch (razorpayError) {
      const details =
        getRazorpayErrorDetails(razorpayError);

      console.error("");
      console.error("==============================================");
      console.error("❌ RAZORPAY ORDER CREATION FAILED");
      console.error("==============================================");
      console.error(
        "MESSAGE =",
        details.message
      );
      console.error(
        "DESCRIPTION =",
        details.description
      );
      console.error(
        "CODE =",
        details.code
      );
      console.error(
        "FIELD =",
        details.field
      );
      console.error(
        "SOURCE =",
        details.source
      );
      console.error(
        "STEP =",
        details.step
      );
      console.error(
        "REASON =",
        details.reason
      );
      console.error(
        "STATUS CODE =",
        details.statusCode
      );
      console.error(
        "FULL RAZORPAY ERROR =",
        razorpayError
      );
      console.error("==============================================");
      console.error("");

      return res.status(500).json({
        success: false,
        message:
          details.description ||
          details.message ||
          "Unable to create Razorpay order.",

        code: details.code || "",
      });
    }

    // ==========================================================
    // VALIDATE RAZORPAY RESPONSE
    // ==========================================================

    if (!razorpayOrder || !razorpayOrder.id) {
      console.error(
        "❌ Razorpay returned an invalid order response."
      );

      return res.status(500).json({
        success: false,
        message:
          "Razorpay returned an invalid order response.",
      });
    }

    // ==========================================================
    // SAVE RAZORPAY ORDER ID IN HEALTHHOME ORDER
    // ==========================================================

    order.razorpayOrderId =
      razorpayOrder.id;

    order.paymentStatus =
      "Pending";

    await order.save();

    console.log(
      "✅ HEALTHHOME ORDER UPDATED WITH RAZORPAY ORDER ID"
    );

    // ==========================================================
    // RESPONSE TO FLUTTER
    // ==========================================================

    return res.status(200).json({
      success: true,

      key: razorpayKeyId,

      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },

      payment: {
        amount: amount,

        userId:
          order.patientId ||
          userId ||
          "",

        userName:
          order.patientName ||
          userName ||
          "",

        userPhone:
          order.patientPhone ||
          userPhone ||
          "",

        serviceType: "Medicine",

        serviceId:
          String(order._id),
      },
    });
  } catch (error) {
    console.error("");
    console.error("==============================================");
    console.error("❌ CREATE RAZORPAY ORDER SERVER ERROR");
    console.error("==============================================");
    console.error("MESSAGE =", error?.message);
    console.error("STACK =", error?.stack);
    console.error("FULL ERROR =", error);
    console.error("==============================================");

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to create Razorpay order.",
    });
  }
};

// ============================================================
// VERIFY RAZORPAY PAYMENT
//
// POST /api/payment/verify-payment
// ============================================================

exports.verifyPayment = async (req, res) => {
  try {
    console.log("");
    console.log("==============================================");
    console.log("VERIFY RAZORPAY PAYMENT");
    console.log("==============================================");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      serviceType,
      serviceId,
    } = req.body;

    console.log(
      "RAZORPAY ORDER ID =",
      razorpay_order_id
    );

    console.log(
      "RAZORPAY PAYMENT ID =",
      razorpay_payment_id
    );

    console.log(
      "SERVICE TYPE =",
      serviceType
    );

    console.log(
      "SERVICE ID =",
      serviceId
    );

    // ==========================================================
    // CHECK RAZORPAY CONFIGURATION
    // ==========================================================

    const razorpayConfig =
      checkRazorpayConfiguration();

    if (!razorpayConfig.success) {
      return res.status(500).json({
        success: false,
        message:
          razorpayConfig.message,
      });
    }

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment information is incomplete.",
      });
    }

    if (!serviceType || !serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "serviceType and serviceId are required.",
      });
    }

    // ==========================================================
    // ONLY MEDICINE PAYMENT
    // ==========================================================

    if (serviceType !== "Medicine") {
      return res.status(400).json({
        success: false,
        message:
          "Only Medicine payment is enabled.",
      });
    }

    // ==========================================================
    // FIND HEALTHHOME ORDER
    // ==========================================================

    const order =
      await Order.findById(serviceId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "HealthHome order not found.",
      });
    }

    console.log(
      "HEALTHHOME ORDER FOUND =",
      order._id
    );

    // ==========================================================
    // VERIFY RAZORPAY ORDER ID
    // ==========================================================

    if (
      String(order.razorpayOrderId) !==
      String(razorpay_order_id)
    ) {
      console.error(
        "❌ RAZORPAY ORDER ID MISMATCH"
      );

      return res.status(400).json({
        success: false,
        message:
          "Razorpay order does not match HealthHome order.",
      });
    }

    // ==========================================================
    // GENERATE SIGNATURE
    // ==========================================================

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpayKeySecret
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    // ==========================================================
    // SAFE SIGNATURE COMPARISON
    // ==========================================================

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      console.error(
        "❌ PAYMENT SIGNATURE LENGTH MISMATCH"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment signature verification failed.",
      });
    }

    if (
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      console.error(
        "❌ RAZORPAY SIGNATURE VERIFICATION FAILED"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment signature verification failed.",
      });
    }

    console.log(
      "✅ RAZORPAY SIGNATURE VERIFIED"
    );

    // ==========================================================
    // FETCH PAYMENT FROM RAZORPAY
    // ==========================================================

    let razorpayPayment;

    try {
      razorpayPayment =
        await razorpay.payments.fetch(
          razorpay_payment_id
        );
    } catch (razorpayError) {
      const details =
        getRazorpayErrorDetails(
          razorpayError
        );

      console.error(
        "❌ FAILED TO FETCH RAZORPAY PAYMENT"
      );

      console.error(details);

      return res.status(500).json({
        success: false,
        message:
          details.description ||
          details.message ||
          "Unable to verify Razorpay payment.",
      });
    }

    console.log(
      "RAZORPAY PAYMENT STATUS =",
      razorpayPayment.status
    );

    // ==========================================================
    // VERIFY PAYMENT BELONGS TO SAME ORDER
    // ==========================================================

    if (
      String(razorpayPayment.order_id) !==
      String(razorpay_order_id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment does not belong to the expected Razorpay order.",
      });
    }

    // ==========================================================
    // VERIFY PAYMENT AMOUNT
    // ==========================================================

    const expectedAmountPaise =
      Math.round(
        Number(order.totalAmount) * 100
      );

    const actualAmountPaise =
      Number(razorpayPayment.amount);

    console.log(
      "EXPECTED AMOUNT PAISE =",
      expectedAmountPaise
    );

    console.log(
      "ACTUAL AMOUNT PAISE =",
      actualAmountPaise
    );

    if (
      actualAmountPaise !==
      expectedAmountPaise
    ) {
      console.error(
        "❌ PAYMENT AMOUNT MISMATCH"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the order amount.",
      });
    }

    // ==========================================================
    // PAYMENT MUST BE CAPTURED
    // ==========================================================

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Payment is not captured. Current status: ${razorpayPayment.status}`,
      });
    }

    // ==========================================================
    // CHECK DUPLICATE PAYMENT
    // ==========================================================

    const existingPayment =
      await Payment.findOne({
        paymentId:
          razorpay_payment_id,
      });

    if (existingPayment) {
      console.log(
        "⚠️ PAYMENT ALREADY EXISTS"
      );

      if (
        order.paymentStatus !==
        "Paid"
      ) {
        order.paymentStatus =
          "Paid";

        order.razorpayPaymentId =
          razorpay_payment_id;

        order.razorpaySignature =
          razorpay_signature;

        await order.save();
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment already verified.",
        payment: existingPayment,
        order: {
          id: order._id,
          totalAmount:
            order.totalAmount,
          paymentMethod:
            order.paymentMethod,
          paymentStatus:
            order.paymentStatus,
          status:
            order.status,
          settlementStatus:
            order.settlementStatus,
        },
      });
    }

    // ==========================================================
    // PAID AMOUNT IN RUPEES
    // ==========================================================

    const paidAmount =
      actualAmountPaise / 100;

    // ==========================================================
    // PLATFORM FEE
    // ==========================================================

    const platformFee =
      Number(
        order.platformFee || 0
      );

    // ==========================================================
    // PHARMACY AMOUNT
    // ==========================================================

    const providerAmount =
      Number(
        order.providerAmount ||
        order.totalAmount ||
        0
      );

    // ==========================================================
    // CREATE PAYMENT RECORD
    // ==========================================================

    const payment =
      await Payment.create({
        orderReferenceId:
          String(order._id),

        paymentId:
          razorpay_payment_id,

        orderId:
          razorpay_order_id,

        signature:
          razorpay_signature,

        userId:
          String(
            order.patientId || ""
          ),

        userName:
          order.patientName || "",

        userPhone:
          order.patientPhone || "",

        serviceType:
          "Medicine",

        serviceId:
          String(order._id),

        amount:
          paidAmount,

        currency:
          razorpayPayment.currency ||
          "INR",

        paymentMethod:
          "ONLINE",

        status:
          "Success",

        razorpayStatus:
          razorpayPayment.status,

        settlementStatus:
          "Pending",

        providerId:
          String(
            order.pharmacyId || ""
          ),

        providerType:
          "Pharmacy",

        platformFee:
          platformFee,

        providerAmount:
          providerAmount,

        cashCollected:
          false,

        cashCollectedAt:
          null,
      });

    console.log(
      "✅ PAYMENT RECORD CREATED:",
      payment._id
    );

    // ==========================================================
    // UPDATE HEALTHHOME ORDER
    // ==========================================================

    order.paymentStatus =
      "Paid";

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.razorpaySignature =
      razorpay_signature;

    order.paymentRecordId =
      String(payment._id);

    order.settlementStatus =
      "Pending";

    await order.save();

    console.log(
      "✅ HEALTHHOME ORDER MARKED AS PAID"
    );

    // ==========================================================
    // FINAL RESPONSE
    // ==========================================================

    return res.status(200).json({
      success: true,

      message:
        "Payment verified successfully.",

      payment,

      order: {
        id:
          order._id,

        totalAmount:
          order.totalAmount,

        paymentMethod:
          order.paymentMethod,

        paymentStatus:
          order.paymentStatus,

        status:
          order.status,

        settlementStatus:
          order.settlementStatus,
      },
    });
  } catch (error) {
    console.error("");
    console.error("==============================================");
    console.error("❌ VERIFY PAYMENT SERVER ERROR");
    console.error("==============================================");
    console.error("MESSAGE =", error?.message);
    console.error("STACK =", error?.stack);
    console.error("FULL ERROR =", error);
    console.error("==============================================");

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Payment verification failed.",
    });
  }
};

// ============================================================
// RAZORPAY WEBHOOK
//
// POST /api/payment/webhook
//
// IMPORTANT:
// server.js must use express.raw() for this route.
// ============================================================

exports.webhook = async (req, res) => {
  try {
    console.log("");
    console.log("==============================================");
    console.log("RAZORPAY WEBHOOK");
    console.log("==============================================");

    // ==========================================================
    // WEBHOOK SECRET
    // ==========================================================

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "❌ RAZORPAY_WEBHOOK_SECRET is missing."
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook secret is not configured.",
      });
    }

    // ==========================================================
    // RAW BODY
    // ==========================================================

    const rawBody =
      req.body;

    if (
      !Buffer.isBuffer(rawBody)
    ) {
      console.error(
        "❌ WEBHOOK BODY IS NOT A RAW BUFFER"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook body.",
      });
    }

    // ==========================================================
    // RAZORPAY WEBHOOK SIGNATURE
    // ==========================================================

    const receivedSignature =
      req.headers[
        "x-razorpay-signature"
      ];

    if (!receivedSignature) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay webhook signature missing.",
      });
    }

    // ==========================================================
    // GENERATE WEBHOOK SIGNATURE
    // ==========================================================

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(rawBody)
        .digest("hex");

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        receivedSignature,
        "utf8"
      );

    // ==========================================================
    // SIGNATURE LENGTH
    // ==========================================================

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      console.error(
        "❌ WEBHOOK SIGNATURE LENGTH MISMATCH"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature.",
      });
    }

    // ==========================================================
    // VERIFY WEBHOOK SIGNATURE
    // ==========================================================

    if (
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      console.error(
        "❌ RAZORPAY WEBHOOK SIGNATURE FAILED"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature.",
      });
    }

    console.log(
      "✅ WEBHOOK SIGNATURE VERIFIED"
    );

    // ==========================================================
    // PARSE WEBHOOK
    // ==========================================================

    const payload =
      JSON.parse(
        rawBody.toString("utf8")
      );

    const event =
      payload.event;

    console.log(
      "RAZORPAY EVENT =",
      event
    );

    // ==========================================================
    // PAYMENT CAPTURED
    // ==========================================================

    if (
      event ===
      "payment.captured"
    ) {
      const paymentEntity =
        payload.payload
          ?.payment
          ?.entity;

      if (!paymentEntity) {
        return res.status(200).json({
          success: true,
          message:
            "Payment entity not found.",
        });
      }

      const razorpayPaymentId =
        paymentEntity.id;

      const razorpayOrderId =
        paymentEntity.order_id;

      console.log(
        "RAZORPAY PAYMENT ID =",
        razorpayPaymentId
      );

      console.log(
        "RAZORPAY ORDER ID =",
        razorpayOrderId
      );

      // ========================================================
      // FIND HEALTHHOME ORDER
      // ========================================================

      const order =
        await Order.findOne({
          razorpayOrderId:
            razorpayOrderId,
        });

      if (!order) {
        console.error(
          "❌ HEALTHHOME ORDER NOT FOUND:",
          razorpayOrderId
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook received.",
        });
      }

      // ========================================================
      // VERIFY AMOUNT
      // ========================================================

      const expectedAmount =
        Math.round(
          Number(order.totalAmount) *
          100
        );

      const webhookAmount =
        Number(
          paymentEntity.amount
        );

      if (
        webhookAmount !==
        expectedAmount
      ) {
        console.error(
          "❌ WEBHOOK AMOUNT MISMATCH"
        );

        console.error(
          "EXPECTED =",
          expectedAmount
        );

        console.error(
          "RECEIVED =",
          webhookAmount
        );

        return res.status(400).json({
          success: false,
          message:
            "Webhook payment amount mismatch.",
        });
      }

      // ========================================================
      // CHECK DUPLICATE
      // ========================================================

      const existingPayment =
        await Payment.findOne({
          paymentId:
            razorpayPaymentId,
        });

      if (existingPayment) {
        console.log(
          "⚠️ WEBHOOK PAYMENT ALREADY PROCESSED:",
          razorpayPaymentId
        );

        if (
          order.paymentStatus !==
          "Paid"
        ) {
          order.paymentStatus =
            "Paid";

          order.razorpayPaymentId =
            razorpayPaymentId;

          order.paymentRecordId =
            String(
              existingPayment._id
            );

          await order.save();
        }

        return res.status(200).json({
          success: true,
          message:
            "Webhook already processed.",
        });
      }

      // ========================================================
      // CREATE PAYMENT RECORD
      // ========================================================

      const payment =
        await Payment.create({
          orderReferenceId:
            String(order._id),

          paymentId:
            razorpayPaymentId,

          orderId:
            razorpayOrderId,

          signature:
            "",

          userId:
            String(
              order.patientId || ""
            ),

          userName:
            order.patientName || "",

          userPhone:
            order.patientPhone || "",

          serviceType:
            "Medicine",

          serviceId:
            String(order._id),

          amount:
            webhookAmount / 100,

          currency:
            paymentEntity.currency ||
            "INR",

          paymentMethod:
            "ONLINE",

          status:
            "Success",

          razorpayStatus:
            paymentEntity.status ||
            "captured",

          settlementStatus:
            "Pending",

          providerId:
            String(
              order.pharmacyId || ""
            ),

          providerType:
            "Pharmacy",

          platformFee:
            Number(
              order.platformFee || 0
            ),

          providerAmount:
            Number(
              order.providerAmount ||
              order.totalAmount ||
              0
            ),

          cashCollected:
            false,

          cashCollectedAt:
            null,
        });

      console.log(
        "✅ WEBHOOK PAYMENT SAVED:",
        payment._id
      );

      // ========================================================
      // UPDATE HEALTHHOME ORDER
      // ========================================================

      order.paymentStatus =
        "Paid";

      order.razorpayPaymentId =
        razorpayPaymentId;

      order.paymentRecordId =
        String(payment._id);

      order.settlementStatus =
        "Pending";

      await order.save();

      console.log(
        "✅ WEBHOOK ORDER UPDATED:",
        order._id
      );
    }

    // ==========================================================
    // PAYMENT FAILED
    // ==========================================================

    if (
      event ===
      "payment.failed"
    ) {
      const paymentEntity =
        payload.payload
          ?.payment
          ?.entity;

      if (paymentEntity) {
        const razorpayOrderId =
          paymentEntity.order_id;

        const order =
          await Order.findOne({
            razorpayOrderId:
              razorpayOrderId,
          });

        if (order) {
          order.paymentStatus =
            "Failed";

          await order.save();

          console.log(
            "❌ PAYMENT FAILED:",
            order._id
          );
        }
      }
    }

    // ==========================================================
    // ORDER PAID
    //
    // Some Razorpay setups can send order.paid.
    // We acknowledge it without creating another
    // Payment record because payment.captured handles it.
    // ==========================================================

    if (
      event ===
      "order.paid"
    ) {
      console.log(
        "ℹ️ RAZORPAY ORDER.PAID RECEIVED"
      );
    }

    // ==========================================================
    // FINAL WEBHOOK RESPONSE
    // ==========================================================

    return res.status(200).json({
      success: true,
      message:
        "Webhook processed successfully.",
    });
  } catch (error) {
    console.error("");
    console.error("==============================================");
    console.error("❌ RAZORPAY WEBHOOK ERROR");
    console.error("==============================================");
    console.error("MESSAGE =", error?.message);
    console.error("STACK =", error?.stack);
    console.error("FULL ERROR =", error);
    console.error("==============================================");

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed.",
    });
  }
};