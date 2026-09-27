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
    const {
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
    } = req.body;

    console.log("");
    console.log("==============================================");
    console.log("CREATE RAZORPAY ORDER");
    console.log("SERVICE TYPE =", serviceType);
    console.log("SERVICE ID =", serviceId);
    console.log("==============================================");

    const razorpayConfig = checkRazorpayConfiguration();

    if (!razorpayConfig.success) {
      return res.status(500).json(razorpayConfig);
    }

    if (!serviceType || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "serviceType and serviceId are required.",
      });
    }

    // ==========================================================
    // MEDICINE
    // ==========================================================
    if (serviceType === "Medicine") {
      const order = await Order.findById(serviceId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Medicine order not found.",
        });
      }

      // The payment request must belong to the same patient.
      if (
        userId &&
        order.patientId &&
        String(userId) !== String(order.patientId)
      ) {
        return res.status(403).json({
          success: false,
          message: "This medicine order does not belong to this patient.",
        });
      }

      if (order.paymentMethod !== "ONLINE") {
        return res.status(400).json({
          success: false,
          message: "Razorpay can only be used for ONLINE orders.",
        });
      }

      if (order.paymentStatus === "Paid") {
        return res.status(400).json({
          success: false,
          message: "This order has already been paid.",
        });
      }

      const amount = Number(order.totalAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid medicine order amount.",
        });
      }

      const amountInPaise = Math.round(amount * 100);
      const receipt = `HH_MED_${order._id}_${Date.now()}`;

      let razorpayOrder;

      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            healthhomeOrderId: String(order._id),
            patientId: String(order.patientId || ""),
            patientPhone: String(order.patientPhone || ""),
            pharmacyId: String(order.pharmacyId || ""),
            serviceType: "Medicine",
          },
        });
      } catch (error) {
        const details = getRazorpayErrorDetails(error);

        return res.status(500).json({
          success: false,
          message:
            details.description ||
            details.message ||
            "Unable to create Razorpay order.",
          code: details.code || "",
        });
      }

      if (!razorpayOrder?.id) {
        return res.status(500).json({
          success: false,
          message: "Razorpay returned an invalid order response.",
        });
      }

      order.razorpayOrderId = razorpayOrder.id;
      order.paymentStatus = "Pending";
      await order.save();

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
          amount,
          userId: order.patientId || userId || "",
          userName: order.patientName || userName || "",
          userPhone: order.patientPhone || userPhone || "",
          serviceType: "Medicine",
          serviceId: String(order._id),
        },
      });
    }

    // ==========================================================
    // LAB
    // ==========================================================
    if (serviceType === "Lab") {
      const LabOrder = require("../models/labOrder");

      const labOrder = await LabOrder.findById(serviceId);

      if (!labOrder) {
        return res.status(404).json({
          success: false,
          message: "Lab booking not found.",
        });
      }

      // Current HealthHome lab flow stores patientId as the
      // patient's phone number. Accept either userId or phone
      // when the stored value is available.
      const requestPatientId = String(userId || "").trim();
      const requestPhone = String(userPhone || "").trim();
      const storedPatientId = String(labOrder.patientId || "").trim();
      const storedPhone = String(labOrder.patientPhone || "").trim();

      const patientMatches =
        !requestPatientId &&
        !requestPhone
          ? false
          : (requestPatientId && storedPatientId &&
              requestPatientId === storedPatientId) ||
            (requestPhone && storedPhone &&
              requestPhone === storedPhone);

      if (!patientMatches) {
        return res.status(403).json({
          success: false,
          message: "This lab booking does not belong to this patient.",
        });
      }

      if (labOrder.paymentStatus === "Paid") {
        return res.status(400).json({
          success: false,
          message: "This lab booking has already been paid.",
        });
      }

      const amount = Number(labOrder.totalAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid lab booking amount. Please create the booking again.",
        });
      }

      const amountInPaise = Math.round(amount * 100);
      const receipt = `HH_LAB_${labOrder._id}_${Date.now()}`;

      let razorpayOrder;

      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            healthhomeLabOrderId: String(labOrder._id),
            patientId: String(labOrder.patientId || ""),
            patientPhone: String(labOrder.patientPhone || ""),
            labId: String(labOrder.labId || ""),
            labName: String(labOrder.labName || ""),
            serviceType: "Lab",
          },
        });
      } catch (error) {
        const details = getRazorpayErrorDetails(error);

        console.error("LAB RAZORPAY CREATE ERROR:", details);

        return res.status(500).json({
          success: false,
          message:
            details.description ||
            details.message ||
            "Unable to create Razorpay order for lab booking.",
          code: details.code || "",
        });
      }

      if (!razorpayOrder?.id) {
        return res.status(500).json({
          success: false,
          message: "Razorpay returned an invalid lab payment order.",
        });
      }

      labOrder.razorpayOrderId = razorpayOrder.id;
      labOrder.paymentStatus = "Pending";
      await labOrder.save();

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
          amount,
          userId: labOrder.patientId || userId || "",
          userName: labOrder.patientName || userName || "",
          userPhone: labOrder.patientPhone || userPhone || "",
          serviceType: "Lab",
          serviceId: String(labOrder._id),
        },
      });
    }

    return res.status(400).json({
      success: false,
      message:
        `Payment creation for service "${serviceType}" is not enabled.`,
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Unable to create Razorpay order.",
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

    console.log("");
    console.log("==============================================");
    console.log("VERIFY RAZORPAY PAYMENT");
    console.log("SERVICE TYPE =", serviceType);
    console.log("SERVICE ID =", serviceId);
    console.log("RAZORPAY ORDER ID =", razorpay_order_id);
    console.log("RAZORPAY PAYMENT ID =", razorpay_payment_id);
    console.log("==============================================");

    const razorpayConfig = checkRazorpayConfiguration();

    if (!razorpayConfig.success) {
      return res.status(500).json(razorpayConfig);
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment information is incomplete.",
      });
    }

    if (!serviceType || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "serviceType and serviceId are required.",
      });
    }

    let service;
    let providerId = "";
    let providerType = "";
    let expectedAmount = 0;
    let servicePatientId = "";
    let servicePatientName = "";
    let servicePatientPhone = "";

    if (serviceType === "Medicine") {
      service = await Order.findById(serviceId);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Medicine order not found.",
        });
      }

      providerId = String(service.pharmacyId || "");
      providerType = "Pharmacy";
      expectedAmount = Number(service.totalAmount);
      servicePatientId = String(service.patientId || "");
      servicePatientName = String(service.patientName || "");
      servicePatientPhone = String(service.patientPhone || "");

      if (service.paymentMethod !== "ONLINE") {
        return res.status(400).json({
          success: false,
          message: "This medicine order is not configured for online payment.",
        });
      }
    } else if (serviceType === "Lab") {
      const LabOrder = require("../models/labOrder");

      service = await LabOrder.findById(serviceId);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Lab booking not found.",
        });
      }

      providerId = String(service.labId || "");
providerType = "Lab";
expectedAmount = Number(service.totalAmount);
      servicePatientId = String(service.patientId || "");
      servicePatientName = String(service.patientName || "");
      servicePatientPhone = String(service.patientPhone || "");
    } else {
      return res.status(400).json({
        success: false,
        message:
          `Payment verification for service "${serviceType}" is not enabled.`,
      });
    }

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service amount.",
      });
    }

    // ==========================================================
    // THE RAZORPAY ORDER ID MUST MATCH OUR DATABASE
    // ==========================================================
    if (
      String(service.razorpayOrderId || "") !==
      String(razorpay_order_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match the HealthHome booking.",
      });
    }

    // ==========================================================
    // SIGNATURE VERIFICATION
    // ==========================================================
    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(
      String(razorpay_signature),
      "utf8"
    );

    if (
      generatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(generatedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    // ==========================================================
    // FETCH PAYMENT DIRECTLY FROM RAZORPAY
    // ==========================================================
    const razorpayPayment =
      await razorpay.payments.fetch(razorpay_payment_id);

    if (
      String(razorpayPayment.order_id || "") !==
      String(razorpay_order_id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment does not belong to the expected Razorpay order.",
      });
    }

    const expectedAmountPaise =
      Math.round(expectedAmount * 100);

    const actualAmountPaise =
      Number(razorpayPayment.amount);

    if (actualAmountPaise !== expectedAmountPaise) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the HealthHome booking amount.",
      });
    }

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message:
          `Payment is not captured. Current status: ${razorpayPayment.status}`,
      });
    }

    // ==========================================================
    // IDEMPOTENCY
    // ==========================================================
    const existingPayment = await Payment.findOne({
      paymentId: razorpay_payment_id,
    });

    if (existingPayment) {
      if (service.paymentStatus !== "Paid") {
        service.paymentStatus = "Paid";
        service.razorpayPaymentId = razorpay_payment_id;
        service.razorpaySignature = razorpay_signature;
        service.paymentRecordId = String(existingPayment._id);
        await service.save();
      }

      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
        payment: existingPayment,
        order: {
          id: service._id,
          totalAmount: expectedAmount,
          paymentStatus: service.paymentStatus,
          status: service.status,
        },
      });
    }

    // If a webhook already marked the service paid with another
    // payment ID, do not silently overwrite it.
    if (service.paymentStatus === "Paid") {
      if (
        String(service.razorpayPaymentId || "") ===
        String(razorpay_payment_id)
      ) {
        return res.status(200).json({
          success: true,
          message: "Payment already verified.",
          order: {
            id: service._id,
            totalAmount: expectedAmount,
            paymentStatus: "Paid",
            status: service.status,
          },
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "This HealthHome service is already linked to another successful payment.",
      });
    }

    const paidAmount = actualAmountPaise / 100;

    const platformFee = Number(service.platformFee || 0);
    const providerAmount = Number(
      service.providerAmount ||
      Math.max(0, expectedAmount - platformFee)
    );

    const payment = await Payment.create({
      orderReferenceId: String(service._id),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,

      userId: servicePatientId,
      userName: servicePatientName,
      userPhone: servicePatientPhone,

      serviceType,
      serviceId: String(service._id),

      amount: paidAmount,
      currency: razorpayPayment.currency || "INR",
      paymentMethod: "ONLINE",

      status: "Success",
      razorpayStatus: razorpayPayment.status,

      settlementStatus: "Pending",

      providerId,
      providerType,

      platformFee,
      providerAmount,

      cashCollected: false,
      cashCollectedAt: null,
    });

    // ==========================================================
    // UPDATE THE REAL HEALTHHOME SERVICE
    // ==========================================================
    service.paymentStatus = "Paid";
    service.razorpayPaymentId = razorpay_payment_id;
    service.razorpaySignature = razorpay_signature;
    service.paymentRecordId = String(payment._id);

    if ("settlementStatus" in service) {
      service.settlementStatus = "Pending";
    }

    await service.save();

    console.log("✅ PAYMENT VERIFIED:", payment._id);
    console.log("✅ SERVICE MARKED PAID:", service._id);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      payment,
      order: {
        id: service._id,
        totalAmount: expectedAmount,
        paymentStatus: service.paymentStatus,
        status: service.status,
      },
    });
  } catch (error) {
    console.error("VERIFY PAYMENT SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Payment verification failed.",
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
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay webhook secret is not configured.",
      });
    }

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook body. server.js must use express.raw() for this route.",
      });
    }

    const receivedSignature =
      req.headers["x-razorpay-signature"];

    if (!receivedSignature) {
      return res.status(400).json({
        success: false,
        message: "Razorpay webhook signature missing.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const generatedBuffer =
      Buffer.from(generatedSignature, "utf8");
    const receivedBuffer =
      Buffer.from(String(receivedSignature), "utf8");

    if (
      generatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const payload =
      JSON.parse(rawBody.toString("utf8"));

    const event = payload.event;

    // ----------------------------------------------------------
    // PAYMENT CAPTURED
    // ----------------------------------------------------------
    if (event === "payment.captured") {
      const paymentEntity =
        payload.payload?.payment?.entity;

      if (!paymentEntity) {
        return res.status(200).json({
          success: true,
          message: "Webhook received without payment entity.",
        });
      }

      const razorpayPaymentId =
        paymentEntity.id;
      const razorpayOrderId =
        paymentEntity.order_id;

      let service = await Order.findOne({
        razorpayOrderId,
      });

      let serviceType = "Medicine";
      let providerType = "Pharmacy";
      let providerId = "";

      if (!service) {
        const LabOrder =
          require("../models/labOrder");

        service = await LabOrder.findOne({
          razorpayOrderId,
        });

        serviceType = "Lab";
providerType = "Lab";

        if (service) {
          providerId = String(service.labId || "");
        }
      } else {
        providerId = String(service.pharmacyId || "");
      }

      if (!service) {
        // Do not repeatedly retry a payment we cannot map.
        return res.status(200).json({
          success: true,
          message: "Webhook received; HealthHome service not found.",
        });
      }

      const expectedAmountPaise =
        Math.round(Number(service.totalAmount) * 100);

      const webhookAmount =
        Number(paymentEntity.amount);

      if (
        !Number.isFinite(expectedAmountPaise) ||
        webhookAmount !== expectedAmountPaise
      ) {
        return res.status(400).json({
          success: false,
          message: "Webhook payment amount mismatch.",
        });
      }

      if (paymentEntity.status !== "captured") {
        return res.status(200).json({
          success: true,
          message: "Payment is not captured yet.",
        });
      }

      const existingPayment =
        await Payment.findOne({
          paymentId: razorpayPaymentId,
        });

      if (existingPayment) {
        if (service.paymentStatus !== "Paid") {
          service.paymentStatus = "Paid";
          service.razorpayPaymentId =
            razorpayPaymentId;
          service.paymentRecordId =
            String(existingPayment._id);
          await service.save();
        }

        return res.status(200).json({
          success: true,
          message: "Webhook already processed.",
        });
      }

      const payment =
        await Payment.create({
          orderReferenceId:
            String(service._id),

          paymentId:
            razorpayPaymentId,

          orderId:
            razorpayOrderId,

          signature: "",

          userId:
            String(service.patientId || ""),

          userName:
            String(service.patientName || ""),

          userPhone:
            String(service.patientPhone || ""),

          serviceType,
          serviceId:
            String(service._id),

          amount:
            webhookAmount / 100,

          currency:
            paymentEntity.currency || "INR",

          paymentMethod:
            "ONLINE",

          status:
            "Success",

          razorpayStatus:
            paymentEntity.status || "captured",

          settlementStatus:
            "Pending",

          providerId,
          providerType,

          platformFee:
            Number(service.platformFee || 0),

          providerAmount:
            Number(
              service.providerAmount ||
              service.totalAmount ||
              0
            ),

          cashCollected:
            false,

          cashCollectedAt:
            null,
        });

      service.paymentStatus = "Paid";
      service.razorpayPaymentId =
        razorpayPaymentId;
      service.paymentRecordId =
        String(payment._id);

      if ("settlementStatus" in service) {
        service.settlementStatus = "Pending";
      }

      await service.save();

      console.log(
        "✅ WEBHOOK PAYMENT SAVED:",
        payment._id
      );
      console.log(
        "✅ WEBHOOK SERVICE MARKED PAID:",
        service._id
      );
    }

    // ----------------------------------------------------------
    // PAYMENT FAILED
    // ----------------------------------------------------------
    if (event === "payment.failed") {
      const paymentEntity =
        payload.payload?.payment?.entity;

      if (paymentEntity?.order_id) {
        const razorpayOrderId =
          paymentEntity.order_id;

        let service = await Order.findOne({
          razorpayOrderId,
        });

        if (!service) {
          const LabOrder =
            require("../models/labOrder");

          service = await LabOrder.findOne({
            razorpayOrderId,
          });
        }

        if (service && service.paymentStatus !== "Paid") {
          service.paymentStatus = "Failed";
          await service.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (error) {
    console.error("RAZORPAY WEBHOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
};

