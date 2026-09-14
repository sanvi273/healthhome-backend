const Razorpay = require("razorpay");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/orderModel");

// ============================================================
// RAZORPAY CONFIGURATION
// ============================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// CREATE RAZORPAY ORDER
//
// POST /api/payment/create-order
//
// IMPORTANT:
// Amount is NOT taken from Flutter.
// Amount comes from the HealthHome Order in MongoDB.
// ============================================================

exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
    } = req.body;

    console.log(
      "========== CREATE RAZORPAY ORDER =========="
    );

    console.log({
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
    });

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!serviceType || !serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "serviceType and serviceId are required.",
      });
    }

    // ========================================================
    // MEDICINE / PHARMACY PAYMENT
    // ========================================================

    if (serviceType === "Medicine") {
      // ------------------------------------------------------
      // serviceId = HealthHome Order MongoDB ID
      // ------------------------------------------------------

      const order = await Order.findById(
        serviceId
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Medicine order not found.",
        });
      }

      // ------------------------------------------------------
      // ONLY ONLINE ORDERS CAN USE RAZORPAY
      // ------------------------------------------------------

      if (
        order.paymentMethod !== "ONLINE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Razorpay can only be used for ONLINE orders.",
        });
      }

      // ------------------------------------------------------
      // PREVENT DUPLICATE PAYMENT
      // ------------------------------------------------------

      if (
        order.paymentStatus === "Paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order has already been paid.",
        });
      }

      // ------------------------------------------------------
      // GET ACTUAL AMOUNT FROM DATABASE
      // ------------------------------------------------------

      const amount =
        Number(order.totalAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order amount.",
        });
      }

      // ------------------------------------------------------
      // CONVERT RUPEES TO PAISE
      // ------------------------------------------------------

      const amountInPaise =
        Math.round(amount * 100);

      // ------------------------------------------------------
      // RAZORPAY RECEIPT
      // ------------------------------------------------------

      const receipt =
        `healthhome_medicine_${order._id}_${Date.now()}`;

      // ------------------------------------------------------
      // CREATE RAZORPAY ORDER
      // ------------------------------------------------------

      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            amountInPaise,

          currency:
            "INR",

          receipt,

          notes: {
            healthhomeOrderId:
              String(order._id),

            patientId:
              String(
                order.patientId || ""
              ),

            patientPhone:
              String(
                order.patientPhone || ""
              ),

            pharmacyId:
              String(
                order.pharmacyId || ""
              ),

            pharmacyName:
              String(
                order.pharmacyName || ""
              ),

            serviceType:
              "Medicine",
          },
        });

      // ------------------------------------------------------
      // SAVE RAZORPAY ORDER ID
      // ------------------------------------------------------

      order.razorpayOrderId =
        razorpayOrder.id;

      order.paymentStatus =
        "Pending";

      await order.save();

      console.log(
        "RAZORPAY ORDER CREATED:",
        razorpayOrder.id
      );

      // ------------------------------------------------------
      // RESPONSE TO FLUTTER
      // ------------------------------------------------------

      return res.status(200).json({
        success: true,

        key:
          process.env.RAZORPAY_KEY_ID,

        order: {
          id:
            razorpayOrder.id,

          amount:
            razorpayOrder.amount,

          currency:
            razorpayOrder.currency,

          receipt:
            razorpayOrder.receipt,
        },

        payment: {
          amount,

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

          serviceType:
            "Medicine",

          serviceId:
            String(order._id),
        },
      });
    }

    // ========================================================
    // OTHER SERVICES
    // ========================================================

    return res.status(400).json({
      success: false,
      message:
        "Only Medicine payment is enabled in the new secure payment flow.",
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      serviceType,
      serviceId,
    } = req.body;

    console.log(
      "========== VERIFY RAZORPAY PAYMENT =========="
    );

    console.log({
      razorpay_order_id,
      razorpay_payment_id,
      serviceType,
      serviceId,
    });

    // ========================================================
    // VALIDATION
    // ========================================================

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

    if (
      !serviceType ||
      !serviceId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "serviceType and serviceId are required.",
      });
    }

    // ========================================================
    // ONLY MEDICINE PAYMENT FOR NOW
    // ========================================================

    if (
      serviceType !== "Medicine"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only Medicine payment is enabled in the new secure payment flow.",
      });
    }

    // ========================================================
    // FIND HEALTHHOME ORDER
    // ========================================================

    const order =
      await Order.findById(
        serviceId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "HealthHome order not found.",
      });
    }

    // ========================================================
    // VERIFY RAZORPAY ORDER ID
    // ========================================================

    if (
      order.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay order does not match HealthHome order.",
      });
    }

    // ========================================================
    // GENERATE SIGNATURE
    // ========================================================

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

    // ========================================================
    // SAFE SIGNATURE COMPARISON
    // ========================================================

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
        "RAZORPAY SIGNATURE VERIFICATION FAILED"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment signature verification failed.",
      });
    }

    // ========================================================
    // FETCH PAYMENT FROM RAZORPAY
    // ========================================================

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    console.log(
      "RAZORPAY PAYMENT STATUS:",
      razorpayPayment.status
    );

    // ========================================================
    // VERIFY PAYMENT BELONGS TO SAME ORDER
    // ========================================================

    if (
      razorpayPayment.order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment does not belong to the expected Razorpay order.",
      });
    }

    // ========================================================
    // VERIFY PAYMENT AMOUNT
    // ========================================================

    const expectedAmountPaise =
      Math.round(
        Number(order.totalAmount) *
          100
      );

    if (
      Number(
        razorpayPayment.amount
      ) !==
      expectedAmountPaise
    ) {
      console.error(
        "PAYMENT AMOUNT MISMATCH"
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the order amount.",
      });
    }

    // ========================================================
    // VERIFY CAPTURED
    // ========================================================

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

    // ========================================================
    // CHECK DUPLICATE PAYMENT
    // ========================================================

    const existingPayment =
      await Payment.findOne({
        paymentId:
          razorpay_payment_id,
      });

    if (existingPayment) {

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

        payment:
          existingPayment,

        order,
      });
    }

    // ========================================================
    // PAYMENT AMOUNT IN RUPEES
    // ========================================================

    const paidAmount =
      Number(
        razorpayPayment.amount
      ) / 100;

    // ========================================================
    // COMMISSION
    // ========================================================

    const platformFee =
      Number(
        order.platformFee || 0
      );

    const providerAmount =
      Number(
        order.providerAmount || 0
      );

    // ========================================================
    // CREATE PAYMENT RECORD
    // ========================================================

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
          order.patientName,

        userPhone:
          order.patientPhone,

        serviceType:
          "Medicine",

        serviceId:
          String(order._id),

        amount:
          paidAmount,

        currency:
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

        platformFee,

        providerAmount,

        cashCollected:
          false,

        cashCollectedAt:
          null,
      });

    // ========================================================
    // UPDATE HEALTHHOME ORDER
    // ========================================================

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
      "PAYMENT VERIFIED:",
      payment._id
    );

    console.log(
      "HEALTHHOME ORDER UPDATED:",
      order._id
    );

    // ========================================================
    // RESPONSE
    // ========================================================

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

    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Payment verification failed.",
    });
  }
};


// ============================================================
// RAZORPAY WEBHOOK
//
// POST /api/payment/webhook
//
// This receives payment events directly from Razorpay.
// ============================================================

exports.webhook = async (req, res) => {
  try {
    console.log(
      "========== RAZORPAY WEBHOOK =========="
    );

    // ========================================================
    // WEBHOOK SECRET
    // ========================================================

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is missing."
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook secret is not configured.",
      });
    }

    // ========================================================
    // RAW BODY
    // ========================================================

    const rawBody =
      req.body;

    if (
      !Buffer.isBuffer(
        rawBody
      )
    ) {
      console.error(
        "Webhook body is not a raw Buffer."
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook body.",
      });
    }

    // ========================================================
    // GET RAZORPAY SIGNATURE
    // ========================================================

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

    // ========================================================
    // GENERATE WEBHOOK SIGNATURE
    // ========================================================

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(rawBody)
        .digest("hex");

    // ========================================================
    // SAFE SIGNATURE COMPARISON
    // ========================================================

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

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature.",
      });
    }

    if (
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      console.error(
        "RAZORPAY WEBHOOK SIGNATURE FAILED"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature.",
      });
    }

    // ========================================================
    // PARSE WEBHOOK
    // ========================================================

    const payload =
      JSON.parse(
        rawBody.toString(
          "utf8"
        )
      );

    const event =
      payload.event;

    console.log(
      "RAZORPAY EVENT:",
      event
    );

    // ========================================================
    // PAYMENT CAPTURED
    // ========================================================

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

      // ------------------------------------------------------
      // FIND HEALTHHOME ORDER
      // ------------------------------------------------------

      const order =
        await Order.findOne({
          razorpayOrderId:
            razorpayOrderId,
        });

      if (!order) {
        console.error(
          "HealthHome order not found:",
          razorpayOrderId
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook received.",
        });
      }

      // ------------------------------------------------------
      // VERIFY AMOUNT
      // ------------------------------------------------------

      const expectedAmount =
        Math.round(
          Number(order.totalAmount) *
            100
        );

      if (
        Number(
          paymentEntity.amount
        ) !==
        expectedAmount
      ) {
        console.error(
          "WEBHOOK AMOUNT MISMATCH"
        );

        return res.status(400).json({
          success: false,
          message:
            "Webhook payment amount mismatch.",
        });
      }

      // ------------------------------------------------------
      // CHECK DUPLICATE
      // ------------------------------------------------------

      const existingPayment =
        await Payment.findOne({
          paymentId:
            razorpayPaymentId,
        });

      if (existingPayment) {
        console.log(
          "Webhook already processed:",
          razorpayPaymentId
        );

        return res.status(200).json({
          success: true,
          message:
            "Webhook already processed.",
        });
      }

      // ------------------------------------------------------
      // CREATE PAYMENT RECORD
      // ------------------------------------------------------

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
            order.patientName,

          userPhone:
            order.patientPhone,

          serviceType:
            "Medicine",

          serviceId:
            String(order._id),

          amount:
            Number(
              paymentEntity.amount
            ) / 100,

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
              order.providerAmount || 0
            ),

          cashCollected:
            false,

          cashCollectedAt:
            null,
        });

      // ------------------------------------------------------
      // UPDATE ORDER
      // ------------------------------------------------------

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
        "WEBHOOK PAYMENT SAVED:",
        payment._id
      );

      console.log(
        "WEBHOOK ORDER UPDATED:",
        order._id
      );
    }

    // ========================================================
    // PAYMENT FAILED
    // ========================================================

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
            "PAYMENT FAILED:",
            order._id
          );
        }
      }
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message:
        "Webhook processed successfully.",
    });

  } catch (error) {

    console.error(
      "RAZORPAY WEBHOOK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed.",
    });
  }
};