const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Order = require("../models/orderModel");

// ============================================================
// RAZORPAY CONFIGURATION
// ============================================================

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayWebhookSecret =
  process.env.RAZORPAY_WEBHOOK_SECRET;

if (!razorpayKeyId) {
  console.error("❌ RAZORPAY_KEY_ID is missing.");
}

if (!razorpayKeySecret) {
  console.error("❌ RAZORPAY_KEY_SECRET is missing.");
}

if (!razorpayWebhookSecret) {
  console.warn(
    "⚠️ RAZORPAY_WEBHOOK_SECRET is missing."
  );
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// ============================================================
// HELPERS
// ============================================================

const safeString = (value) =>
  String(value ?? "").trim();

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(
    String(id)
  );

const getLabOrderModel = () =>
  require("../models/labOrder");

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

const getRazorpayErrorDetails = (error) => ({
  message: error?.message || "",
  description:
    error?.error?.description || "",
  code:
    error?.error?.code || "",
  field:
    error?.error?.field || "",
  source:
    error?.error?.source || "",
  step:
    error?.error?.step || "",
  reason:
    error?.error?.reason || "",
  statusCode:
    error?.statusCode || "",
});

// ============================================================
// GET SERVICE DATA
// ============================================================

const getServiceData = async (
  serviceType,
  serviceId
) => {
  if (!serviceType || !serviceId) {
    throw new Error(
      "serviceType and serviceId are required."
    );
  }

  // ==========================================================
  // DOCTOR
  // ==========================================================

  if (serviceType === "Doctor") {
    if (!isValidObjectId(serviceId)) {
      throw new Error(
        "Invalid doctor ID."
      );
    }

    const doctor =
      await mongoose.connection
        .collection("doctors")
        .findOne({
          _id:
            new mongoose.Types.ObjectId(
              serviceId
            ),
        });

    if (!doctor) {
      throw new Error(
        "Doctor not found."
      );
    }

    const amount =
      Number(doctor.fees);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Invalid doctor consultation fee."
      );
    }

    return {
      service: doctor,

      amount,

      patientId: "",
      patientName: "",
      patientPhone: "",

      providerId:
        String(doctor._id),

      providerType: "Doctor",

      serviceType: "Doctor",

      serviceId:
        String(doctor._id),

      alreadyPaid: false,

      serviceStatus: "",
    };
  }

  // ==========================================================
  // MEDICINE
  // ==========================================================

  if (serviceType === "Medicine") {
    if (!isValidObjectId(serviceId)) {
      throw new Error(
        "Invalid medicine order ID."
      );
    }

    const order =
      await Order.findById(
        serviceId
      );

    if (!order) {
      throw new Error(
        "Medicine order not found."
      );
    }

    const amount =
      Number(order.totalAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Invalid medicine order amount."
      );
    }

    return {
      service: order,

      amount,

      patientId:
        safeString(order.patientId),

      patientName:
        safeString(order.patientName),

      patientPhone:
        safeString(order.patientPhone),

      providerId:
        safeString(order.pharmacyId),

      providerType: "Pharmacy",

      serviceType: "Medicine",

      serviceId:
        String(order._id),

      alreadyPaid:
        safeString(
          order.paymentStatus
        ) === "Paid",

      serviceStatus:
        safeString(order.status),
    };
  }

  // ==========================================================
  // LAB
  // ==========================================================

  if (serviceType === "Lab") {
    if (!isValidObjectId(serviceId)) {
      throw new Error(
        "Invalid lab booking ID."
      );
    }

    const LabOrder =
      getLabOrderModel();

    const labOrder =
      await LabOrder.findById(
        serviceId
      );

    if (!labOrder) {
      throw new Error(
        "Lab booking not found."
      );
    }

    const amount =
      Number(labOrder.totalAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Invalid lab booking amount."
      );
    }

    return {
      service: labOrder,

      amount,

      patientId:
        safeString(
          labOrder.patientId
        ),

      patientName:
        safeString(
          labOrder.patientName
        ),

      patientPhone:
        safeString(
          labOrder.patientPhone
        ),

      providerId:
        safeString(
          labOrder.labId
        ),

      providerType: "Lab",

      serviceType: "Lab",

      serviceId:
        String(labOrder._id),

      alreadyPaid:
        safeString(
          labOrder.paymentStatus
        ) === "Paid",

      serviceStatus:
        safeString(
          labOrder.status
        ),
    };
  }

  throw new Error(
    `Payment for service "${serviceType}" is not enabled.`
  );
};

// ============================================================
// PATIENT VALIDATION
// ============================================================

const validatePatientForService = (
  data,
  userId,
  userPhone
) => {
  // Doctor payment is allowed before
  // appointment creation.
  if (
    data.serviceType === "Doctor"
  ) {
    return true;
  }

  const requestedUserId =
    safeString(userId);

  const requestedPhone =
    safeString(userPhone);

  const matchesId =
    requestedUserId &&
    data.patientId &&
    requestedUserId ===
      data.patientId;

  const matchesPhone =
    requestedPhone &&
    data.patientPhone &&
    requestedPhone ===
      data.patientPhone;

  return Boolean(
    matchesId || matchesPhone
  );
};

// ============================================================
// MARK SERVICE AS PAID
// ============================================================

const markServicePaid = async (
  serviceData,
  paymentRecord
) => {
  // Doctor appointment is created
  // after successful payment.
  if (
    serviceData.serviceType ===
    "Doctor"
  ) {
    return;
  }

  const service =
    serviceData.service;

  service.paymentStatus =
    "Paid";

  if (
    "razorpayPaymentId" in
    service
  ) {
    service.razorpayPaymentId =
      paymentRecord.paymentId;
  }

  if (
    "paymentRecordId" in
    service
  ) {
    service.paymentRecordId =
      String(
        paymentRecord._id
      );
  }

  if (
    "settlementStatus" in
    service
  ) {
    service.settlementStatus =
      "Pending";
  }

  await service.save();
};

// ============================================================
// CREATE NORMAL RAZORPAY CHECKOUT ORDER
//
// POST
// /api/payment/create-order
//
// This creates a Razorpay ORDER.
// It does NOT create a QR code.
//
// Flutter then opens Razorpay Checkout.
//
// Supported inside Razorpay Checkout:
// - UPI
// - Cards
// - Net Banking
// - Wallets
// ============================================================

exports.createOrder = async (
  req,
  res
) => {
  console.log(
    "🔥 NORMAL RAZORPAY CHECKOUT CREATE ORDER"
  );

  try {
    const {
      userId,
      userName,
      userPhone,
      serviceType,
      serviceId,
    } = req.body;

    // --------------------------------------------------------
    // CONFIGURATION
    // --------------------------------------------------------

    const config =
      checkRazorpayConfiguration();

    if (!config.success) {
      return res.status(500).json(
        config
      );
    }

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

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

    if (
      ![
        "Doctor",
        "Medicine",
        "Lab",
      ].includes(serviceType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Payment for service "${serviceType}" is not enabled.`,
      });
    }

    // --------------------------------------------------------
    // GET SERVICE
    // --------------------------------------------------------

    let serviceData;

    try {
      serviceData =
        await getServiceData(
          serviceType,
          serviceId
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    // --------------------------------------------------------
    // PATIENT OWNERSHIP
    // --------------------------------------------------------

    if (
      serviceType !== "Doctor" &&
      !validatePatientForService(
        serviceData,
        userId,
        userPhone
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This payment does not belong to this patient.",
      });
    }

    // --------------------------------------------------------
    // MEDICINE MUST BE ONLINE
    // --------------------------------------------------------

    if (
      serviceType ===
        "Medicine" &&
      safeString(
        serviceData.service
          .paymentMethod
      ) !== "ONLINE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay can only be used for ONLINE medicine orders.",
      });
    }

    // --------------------------------------------------------
    // ALREADY PAID
    // --------------------------------------------------------

    if (
      serviceData.alreadyPaid
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This service has already been paid.",
      });
    }

    // --------------------------------------------------------
    // SERVER-SIDE AMOUNT
    //
    // NEVER trust amount from Flutter.
    // --------------------------------------------------------

    const amountInPaise =
      Math.round(
        Number(
          serviceData.amount
        ) * 100
      );

    if (
      !Number.isFinite(
        amountInPaise
      ) ||
      amountInPaise <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment amount.",
      });
    }

    // --------------------------------------------------------
    // REUSE EXISTING RAZORPAY ORDER
    //
    // This helps when user opens payment
    // again after leaving Checkout.
    // --------------------------------------------------------

    if (
      serviceType !== "Doctor" &&
      safeString(
        serviceData.service
          .razorpayOrderId
      )
    ) {
      const existingOrderId =
        safeString(
          serviceData.service
            .razorpayOrderId
        );

      try {
        const existingRazorpayOrder =
          await razorpay.orders.fetch(
            existingOrderId
          );

        if (
          existingRazorpayOrder &&
          existingRazorpayOrder.id &&
          Number(
            existingRazorpayOrder.amount
          ) === amountInPaise &&
          existingRazorpayOrder.currency ===
            "INR"
        ) {
          console.log(
            "♻️ REUSING EXISTING RAZORPAY ORDER:",
            existingOrderId
          );

          return res.status(200).json({
            success: true,

            message:
              "Existing Razorpay order returned.",

            key:
              razorpayKeyId,

            order: {
              id:
                existingRazorpayOrder.id,

              amount:
                Number(
                  existingRazorpayOrder.amount
                ),

              currency:
                existingRazorpayOrder.currency,

              status:
                existingRazorpayOrder.status,

              receipt:
                existingRazorpayOrder.receipt,
            },
          });
        }
      } catch (error) {
        console.log(
          "⚠️ EXISTING RAZORPAY ORDER COULD NOT BE REUSED:",
          getRazorpayErrorDetails(
            error
          )
        );

        // Continue and create a new order.
      }
    }

    // --------------------------------------------------------
    // RECEIPT
    // --------------------------------------------------------

    const receipt =
      `HH_${serviceType}_${String(
        serviceData.serviceId
      ).slice(-20)}_${Date.now()}`;

    // --------------------------------------------------------
    // CREATE RAZORPAY ORDER
    // --------------------------------------------------------

    let razorpayOrder;

    try {
      razorpayOrder =
        await razorpay.orders.create({
          amount:
            amountInPaise,

          currency:
            "INR",

          receipt,

          notes: {
            healthhomeServiceType:
              serviceType,

            healthhomeServiceId:
              serviceData.serviceId,

            healthhomeUserId:
              safeString(
                userId ||
                serviceData.patientId
              ),

            healthhomeUserPhone:
              safeString(
                userPhone ||
                serviceData.patientPhone
              ),
          },
        });
    } catch (error) {
      const details =
        getRazorpayErrorDetails(
          error
        );

      console.error(
        "❌ RAZORPAY ORDER CREATE ERROR:",
        details
      );

      return res.status(500).json({
        success: false,

        message:
          details.description ||
          details.message ||
          "Unable to create Razorpay order.",

        code:
          details.code || "",
      });
    }

    // --------------------------------------------------------
    // VALIDATE RAZORPAY RESPONSE
    // --------------------------------------------------------

    if (
      !razorpayOrder ||
      !razorpayOrder.id
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay returned an invalid order.",
      });
    }

    if (
      Number(
        razorpayOrder.amount
      ) !== amountInPaise
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay order amount mismatch.",
      });
    }

    // --------------------------------------------------------
    // SAVE RAZORPAY ORDER ID
    //
    // Medicine and Lab orders have
    // razorpayOrderId fields.
    // --------------------------------------------------------

    if (
      serviceType !== "Doctor"
    ) {
      serviceData.service
        .razorpayOrderId =
        razorpayOrder.id;

      await serviceData.service.save();
    }

    // --------------------------------------------------------
    // CREATE PENDING CENTRAL PAYMENT RECORD
    //
    // Only if one does not already exist
    // for this Razorpay order.
    // --------------------------------------------------------

    let paymentRecord =
      await Payment.findOne({
        orderId:
          razorpayOrder.id,
      });

    if (!paymentRecord) {
      const platformFee =
        Number(
          serviceData.service
            ?.platformFee || 0
        );

      const providerAmount =
        Number(
          serviceData.service
            ?.providerAmount ??
            Math.max(
              0,
              serviceData.amount -
                platformFee
            )
        );

      paymentRecord =
        await Payment.create({
          orderReferenceId:
            serviceData.serviceId,

          paymentId:
            "",

          orderId:
            razorpayOrder.id,

          signature:
            "",

          userId:
            serviceType === "Doctor"
              ? safeString(userId)
              : serviceData.patientId,

          userName:
            serviceType === "Doctor"
              ? safeString(userName)
              : serviceData.patientName,

          userPhone:
            serviceType === "Doctor"
              ? safeString(userPhone)
              : serviceData.patientPhone,

          serviceType,

          serviceId:
            serviceData.serviceId,

          amount:
            serviceData.amount,

          currency:
            "INR",

          paymentMethod:
            "ONLINE",

          status:
            "Pending",

          razorpayStatus:
            razorpayOrder.status ||
            "created",

          settlementStatus:
            "Pending",

          providerId:
            serviceData.providerId,

          providerType:
            serviceData.providerType,

          platformFee,

          providerAmount,

          cashCollected:
            false,

          cashCollectedAt:
            null,
        });
    }

    // --------------------------------------------------------
    // RESPONSE TO FLUTTER
    // --------------------------------------------------------

    console.log(
      "=============================================="
    );

    console.log(
      "✅ RAZORPAY CHECKOUT ORDER CREATED"
    );

    console.log(
      "RAZORPAY ORDER ID:",
      razorpayOrder.id
    );

    console.log(
      "AMOUNT:",
      serviceData.amount
    );

    console.log(
      "AMOUNT PAISE:",
      amountInPaise
    );

    console.log(
      "SERVICE:",
      serviceType
    );

    console.log(
      "SERVICE ID:",
      serviceData.serviceId
    );

    console.log(
      "PAYMENT RECORD:",
      paymentRecord?._id
    );

    console.log(
      "=============================================="
    );

    return res.status(200).json({
      success: true,

      message:
        "Razorpay order created successfully.",

      key:
        razorpayKeyId,

      order: {
        id:
          razorpayOrder.id,

        amount:
          Number(
            razorpayOrder.amount
          ),

        currency:
          razorpayOrder.currency ||
          "INR",

        status:
          razorpayOrder.status ||
          "created",

        receipt:
          razorpayOrder.receipt ||
          receipt,
      },

      payment: {
        paymentRecordId:
          paymentRecord
            ? String(
                paymentRecord._id
              )
            : "",

        serviceType,

        serviceId:
          serviceData.serviceId,

        amount:
          serviceData.amount,

        currency:
          "INR",

        status:
          "Pending",
      },
    });
  } catch (error) {
    console.error(
      "❌ CREATE PAYMENT SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to create payment order.",
    });
  }
};

// ============================================================
// VERIFY NORMAL RAZORPAY CHECKOUT PAYMENT
//
// POST
// /api/payment/verify-payment
//
// Flutter sends:
//
// razorpay_order_id
// razorpay_payment_id
// razorpay_signature
// serviceType
// serviceId
//
// Server verifies:
// 1. Patient ownership
// 2. Razorpay order ID
// 3. Razorpay signature
// 4. Payment amount
// 5. Payment status
// 6. Duplicate payment
// ============================================================

exports.verifyPayment = async (
  req,
  res
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      serviceType,
      serviceId,
      userId,
      userPhone,
    } = req.body;

    // --------------------------------------------------------
    // CONFIGURATION
    // --------------------------------------------------------

    const config =
      checkRazorpayConfiguration();

    if (!config.success) {
      return res.status(500).json(
        config
      );
    }

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
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
        paid: false,
        message:
          "serviceType and serviceId are required.",
      });
    }

    if (
      ![
        "Doctor",
        "Medicine",
        "Lab",
      ].includes(serviceType)
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          `Payment for service "${serviceType}" is not enabled.`,
      });
    }

    // --------------------------------------------------------
    // GET SERVICE
    // --------------------------------------------------------

    let serviceData;

    try {
      serviceData =
        await getServiceData(
          serviceType,
          serviceId
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          error.message,
      });
    }

    // --------------------------------------------------------
    // PATIENT OWNERSHIP
    // --------------------------------------------------------

    if (
      serviceType !== "Doctor" &&
      !validatePatientForService(
        serviceData,
        userId,
        userPhone
      )
    ) {
      return res.status(403).json({
        success: false,
        paid: false,
        message:
          "This payment does not belong to this patient.",
      });
    }

    // --------------------------------------------------------
    // MEDICINE MUST BE ONLINE
    // --------------------------------------------------------

    if (
      serviceType ===
        "Medicine" &&
      safeString(
        serviceData.service
          .paymentMethod
      ) !== "ONLINE"
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "This medicine order is not an ONLINE payment order.",
      });
    }

    // --------------------------------------------------------
    // ALREADY PAID
    // --------------------------------------------------------

    if (
      serviceData.alreadyPaid
    ) {
      return res.status(200).json({
        success: true,
        paid: true,
        message:
          "Payment has already been completed.",
      });
    }

    // --------------------------------------------------------
    // CHECK RAZORPAY ORDER ID
    // --------------------------------------------------------

    if (
      serviceType !== "Doctor"
    ) {
      const expectedOrderId =
        safeString(
          serviceData.service
            .razorpayOrderId
        );

      if (
        !expectedOrderId
      ) {
        return res.status(400).json({
          success: false,
          paid: false,
          message:
            "No Razorpay order is associated with this service.",
        });
      }

      if (
        expectedOrderId !==
        safeString(
          razorpay_order_id
        )
      ) {
        return res.status(400).json({
          success: false,
          paid: false,
          message:
            "Razorpay order ID does not match this service.",
        });
      }
    }

    // --------------------------------------------------------
    // VERIFY RAZORPAY SIGNATURE
    //
    // HMAC SHA256:
    //
    // razorpay_order_id + "|" + razorpay_payment_id
    // --------------------------------------------------------

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

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        String(
          razorpay_signature
        ),
        "utf8"
      );

    if (
      generatedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      console.error(
        "❌ INVALID RAZORPAY PAYMENT SIGNATURE"
      );

      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Invalid Razorpay payment signature.",
      });
    }

    console.log(
      "✅ RAZORPAY SIGNATURE VERIFIED"
    );

    // --------------------------------------------------------
    // FETCH PAYMENT DIRECTLY FROM RAZORPAY
    //
    // This gives us the authoritative
    // payment status and amount.
    // --------------------------------------------------------

    let razorpayPayment;

    try {
      razorpayPayment =
        await razorpay.payments.fetch(
          razorpay_payment_id
        );
    } catch (error) {
      const details =
        getRazorpayErrorDetails(
          error
        );

      console.error(
        "❌ RAZORPAY PAYMENT FETCH ERROR:",
        details
      );

      return res.status(502).json({
        success: false,
        paid: false,
        message:
          details.description ||
          details.message ||
          "Unable to fetch payment from Razorpay.",
      });
    }

    if (
      !razorpayPayment
    ) {
      return res.status(502).json({
        success: false,
        paid: false,
        message:
          "Razorpay payment was not found.",
      });
    }

    // --------------------------------------------------------
    // VERIFY PAYMENT BELONGS TO ORDER
    // --------------------------------------------------------

    if (
      safeString(
        razorpayPayment.order_id
      ) !==
      safeString(
        razorpay_order_id
      )
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Razorpay payment does not belong to the specified order.",
      });
    }

    // --------------------------------------------------------
    // EXPECTED AMOUNT
    // --------------------------------------------------------

    const expectedAmountPaise =
      Math.round(
        Number(
          serviceData.amount
        ) * 100
      );

    const actualAmountPaise =
      Number(
        razorpayPayment.amount
      );

    console.log(
      "EXPECTED AMOUNT PAISE =",
      expectedAmountPaise
    );

    console.log(
      "RAZORPAY PAYMENT AMOUNT PAISE =",
      actualAmountPaise
    );

    // --------------------------------------------------------
    // VERIFY AMOUNT
    // --------------------------------------------------------

    if (
      !Number.isFinite(
        expectedAmountPaise
      ) ||
      actualAmountPaise !==
        expectedAmountPaise
    ) {
      console.error(
        "❌ PAYMENT AMOUNT MISMATCH"
      );

      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Payment amount does not match the service amount.",
      });
    }

    // --------------------------------------------------------
    // VERIFY CURRENCY
    // --------------------------------------------------------

    const paymentCurrency =
      safeString(
        razorpayPayment.currency
      ) || "INR";

    if (
      paymentCurrency !==
      "INR"
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          "Unsupported payment currency.",
      });
    }

    // --------------------------------------------------------
    // PAYMENT MUST BE CAPTURED
    // --------------------------------------------------------

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      return res.status(400).json({
        success: false,
        paid: false,
        message:
          `Payment is not captured. Current status: ${razorpayPayment.status}`,
      });
    }

    // --------------------------------------------------------
    // DUPLICATE PAYMENT CHECK
    // --------------------------------------------------------

    let existingPayment =
      await Payment.findOne({
        paymentId:
          razorpay_payment_id,
      });

    if (
      existingPayment
    ) {
      console.log(
        "⚠️ PAYMENT ALREADY EXISTS:",
        existingPayment._id
      );

      // If webhook created the payment
      // before Flutter verification,
      // make sure the service is also marked paid.
      await markServicePaid(
        serviceData,
        existingPayment
      );

      return res.status(200).json({
        success: true,
        paid: true,

        message:
          "Payment already verified.",

        payment: {
          paymentRecordId:
            String(
              existingPayment._id
            ),

          paymentId:
            existingPayment.paymentId,

          orderId:
            existingPayment.orderId,

          amount:
            existingPayment.amount,

          currency:
            existingPayment.currency,

          status:
            "Success",
        },

        order: {
          id:
            serviceData.serviceId,

          totalAmount:
            serviceData.amount,

          paymentMethod:
            "ONLINE",

          paymentStatus:
            "Paid",

          status:
            serviceData.serviceStatus,
        },
      });
    }

    // --------------------------------------------------------
    // CHECK WHETHER RAZORPAY PAYMENT IS ALREADY LINKED
    // TO A DIFFERENT HEALTHHOME PAYMENT RECORD
    // --------------------------------------------------------

    existingPayment =
      await Payment.findOne({
        paymentId:
          razorpay_payment_id,
      });

    if (
      existingPayment
    ) {
      return res.status(409).json({
        success: false,
        paid: false,
        message:
          "This Razorpay payment is already linked to another HealthHome payment.",
      });
    }

    // --------------------------------------------------------
    // PAID AMOUNT IN RUPEES
    // --------------------------------------------------------

    const paidAmount =
      actualAmountPaise / 100;

    // --------------------------------------------------------
    // PLATFORM FEE
    // --------------------------------------------------------

    const platformFee =
      Number(
        serviceData.service
          ?.platformFee || 0
      );

    // --------------------------------------------------------
    // PROVIDER AMOUNT
    // --------------------------------------------------------

    const providerAmount =
      Number(
        serviceData.service
          ?.providerAmount ??
          Math.max(
            0,
            serviceData.amount -
              platformFee
          )
      );

    // --------------------------------------------------------
    // CREATE SUCCESSFUL PAYMENT RECORD
    // --------------------------------------------------------

    const payment =
      await Payment.create({
        orderReferenceId:
          serviceData.serviceId,

        paymentId:
          razorpay_payment_id,

        orderId:
          razorpay_order_id,

        signature:
          razorpay_signature,

        userId:
          serviceType === "Doctor"
            ? safeString(userId)
            : serviceData.patientId,

        userName:
          serviceType === "Doctor"
            ? safeString(userId)
              ? safeString(
                  userId
                )
              : safeString(
                  serviceData.patientName
                )
            : serviceData.patientName,

        userPhone:
          serviceType === "Doctor"
            ? safeString(
                userPhone
              )
            : serviceData.patientPhone,

        serviceType,

        serviceId:
          serviceData.serviceId,

        amount:
          paidAmount,

        currency:
          paymentCurrency,

        paymentMethod:
          "ONLINE",

        status:
          "Success",

        razorpayStatus:
          razorpayPayment.status,

        settlementStatus:
          "Pending",

        providerId:
          serviceData.providerId,

        providerType:
          serviceData.providerType,

        platformFee,

        providerAmount,

        cashCollected:
          false,

        cashCollectedAt:
          null,
      });

    // --------------------------------------------------------
    // MARK SERVICE PAID
    // --------------------------------------------------------

    await markServicePaid(
      serviceData,
      payment
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    console.log(
      "=============================================="
    );

    console.log(
      "✅ RAZORPAY PAYMENT VERIFIED"
    );

    console.log(
      "RAZORPAY ORDER ID:",
      razorpay_order_id
    );

    console.log(
      "RAZORPAY PAYMENT ID:",
      razorpay_payment_id
    );

    console.log(
      "SERVICE TYPE:",
      serviceType
    );

    console.log(
      "SERVICE ID:",
      serviceId
    );

    console.log(
      "AMOUNT:",
      paidAmount
    );

    console.log(
      "PAYMENT RECORD:",
      payment._id
    );

    console.log(
      "=============================================="
    );

    return res.status(200).json({
      success: true,

      paid: true,

      message:
        "Payment verified successfully.",

      payment: {
        paymentRecordId:
          String(
            payment._id
          ),

        paymentId:
          payment.paymentId,

        orderId:
          payment.orderId,

        amount:
          payment.amount,

        currency:
          payment.currency,

        method:
          razorpayPayment.method ||
          "ONLINE",

        status:
          "Success",

        serviceType:
          payment.serviceType,

        serviceId:
          payment.serviceId,
      },

      order: {
        id:
          serviceData.serviceId,

        totalAmount:
          serviceData.amount,

        paymentMethod:
          "ONLINE",

        paymentStatus:
          "Paid",

        status:
          serviceData.serviceStatus,
      },
    });
  } catch (error) {
    console.error(
      "❌ VERIFY PAYMENT SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      paid: false,
      message:
        error?.message ||
        "Payment verification failed.",
    });
  }
};

// ============================================================
// OLD QR STATUS COMPATIBILITY
//
// Your current app uses normal Razorpay Checkout.
// These endpoints are retained so an older Flutter build
// does not crash if it still calls them.
//
// They are NOT used by the new payment flow.
// ============================================================

exports.getQrPaymentStatus = async (
  req,
  res
) => {
  return res.status(410).json({
    success: false,
    paid: false,
    message:
      "QR payments are no longer used. Please use Razorpay Checkout.",
  });
};

// ============================================================
// OLD QR CLOSE COMPATIBILITY
// ============================================================

exports.closeQr = async (
  req,
  res
) => {
  return res.status(410).json({
    success: false,
    message:
      "QR payments are no longer used. Please use Razorpay Checkout.",
  });
};

// ============================================================
// RAZORPAY WEBHOOK
//
// POST
// /api/payment/webhook
//
// server.js MUST use:
//
// app.use(
//   "/api/payment/webhook",
//   express.raw({
//     type: "application/json",
//   })
// );
//
// Your current server.js already does this correctly.
// ============================================================

exports.webhook = async (
  req,
  res
) => {
  try {
    // --------------------------------------------------------
    // WEBHOOK SECRET
    // --------------------------------------------------------

    if (
      !razorpayWebhookSecret
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay webhook secret is not configured.",
      });
    }

    // --------------------------------------------------------
    // RAW BODY
    // --------------------------------------------------------

    const rawBody =
      req.body;

    if (
      !Buffer.isBuffer(
        rawBody
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook body. server.js must use express.raw() for this route.",
      });
    }

    // --------------------------------------------------------
    // RECEIVED SIGNATURE
    // --------------------------------------------------------

    const receivedSignature =
      req.headers[
        "x-razorpay-signature"
      ];

    if (
      !receivedSignature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay webhook signature missing.",
      });
    }

    // --------------------------------------------------------
    // GENERATE SIGNATURE
    // --------------------------------------------------------

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpayWebhookSecret
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
        String(
          receivedSignature
        ),
        "utf8"
      );

    // --------------------------------------------------------
    // SAFE SIGNATURE COMPARISON
    // --------------------------------------------------------

    if (
      generatedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )
    ) {
      console.error(
        "❌ INVALID RAZORPAY WEBHOOK SIGNATURE"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature.",
      });
    }

    // --------------------------------------------------------
    // PARSE WEBHOOK
    // --------------------------------------------------------

    let payload;

    try {
      payload =
        JSON.parse(
          rawBody.toString(
            "utf8"
          )
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook JSON.",
      });
    }

    const event =
      payload.event;

    console.log(
      "📩 RAZORPAY WEBHOOK EVENT:",
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
        payload
          .payload
          ?.payment
          ?.entity;

      if (
        !paymentEntity
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Webhook received without payment entity.",
        });
      }

      const razorpayPaymentId =
        safeString(
          paymentEntity.id
        );

      const razorpayOrderId =
        safeString(
          paymentEntity.order_id
        );

      if (
        !razorpayPaymentId ||
        !razorpayOrderId
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Webhook payment does not contain a Razorpay order ID.",
        });
      }

      // ------------------------------------------------------
      // DUPLICATE WEBHOOK / PAYMENT
      // ------------------------------------------------------

      const existingPayment =
        await Payment.findOne({
          paymentId:
            razorpayPaymentId,
        });

      if (
        existingPayment
      ) {
        console.log(
          "⚠️ WEBHOOK PAYMENT ALREADY PROCESSED:",
          razorpayPaymentId
        );

        return res.status(200).json({
          success: true,
          message:
            "Payment already processed.",
        });
      }

      // ------------------------------------------------------
      // FIND MEDICINE ORDER
      // ------------------------------------------------------

      let service =
        await Order.findOne({
          razorpayOrderId,
        });

      let serviceType =
        "Medicine";

      let providerType =
        "Pharmacy";

      let providerId =
        "";

      // ------------------------------------------------------
      // IF NOT MEDICINE -> TRY LAB
      // ------------------------------------------------------

      if (!service) {
        const LabOrder =
          getLabOrderModel();

        service =
          await LabOrder.findOne({
            razorpayOrderId,
          });

        serviceType =
          "Lab";

        providerType =
          "Lab";

        if (service) {
          providerId =
            safeString(
              service.labId
            );
        }
      } else {
        providerId =
          safeString(
            service.pharmacyId
          );
      }

      // ------------------------------------------------------
      // SERVICE FOUND
      // ------------------------------------------------------

      if (service) {
        const expectedAmountPaise =
          Math.round(
            Number(
              service.totalAmount
            ) * 100
          );

        const webhookAmount =
          Number(
            paymentEntity.amount
          );

        const webhookCurrency =
          safeString(
            paymentEntity.currency
          ) || "INR";

        console.log(
          "WEBHOOK EXPECTED AMOUNT:",
          expectedAmountPaise
        );

        console.log(
          "WEBHOOK ACTUAL AMOUNT:",
          webhookAmount
        );

        // ----------------------------------------------------
        // VALIDATE PAYMENT
        // ----------------------------------------------------

        if (
          Number.isFinite(
            expectedAmountPaise
          ) &&
          webhookAmount ===
            expectedAmountPaise &&
          webhookCurrency ===
            "INR" &&
          paymentEntity.status ===
            "captured"
        ) {
          const platformFee =
            Number(
              service.platformFee ||
                0
            );

          const providerAmount =
            Number(
              service.providerAmount ??
                Math.max(
                  0,
                  Number(
                    service.totalAmount
                  ) -
                    platformFee
                )
            );

          // --------------------------------------------------
          // CREATE PAYMENT RECORD
          // --------------------------------------------------

          const payment =
            await Payment.create({
              orderReferenceId:
                String(
                  service._id
                ),

              paymentId:
                razorpayPaymentId,

              orderId:
                razorpayOrderId,

              signature:
                "",

              userId:
                safeString(
                  service.patientId
                ),

              userName:
                safeString(
                  service.patientName
                ),

              userPhone:
                safeString(
                  service.patientPhone
                ),

              serviceType,

              serviceId:
                String(
                  service._id
                ),

              amount:
                webhookAmount / 100,

              currency:
                webhookCurrency,

              paymentMethod:
                "ONLINE",

              status:
                "Success",

              razorpayStatus:
                paymentEntity.status,

              settlementStatus:
                "Pending",

              providerId,

              providerType,

              platformFee,

              providerAmount,

              cashCollected:
                false,

              cashCollectedAt:
                null,
            });

          // --------------------------------------------------
          // MARK SERVICE PAID
          // --------------------------------------------------

          service.paymentStatus =
            "Paid";

          if (
            "razorpayPaymentId" in
            service
          ) {
            service.razorpayPaymentId =
              razorpayPaymentId;
          }

          if (
            "paymentRecordId" in
            service
          ) {
            service.paymentRecordId =
              String(
                payment._id
              );
          }

          if (
            "settlementStatus" in
            service
          ) {
            service.settlementStatus =
              "Pending";
          }

          await service.save();

          console.log(
            "✅ WEBHOOK PAYMENT SAVED:",
            payment._id
          );

          console.log(
            "✅ SERVICE MARKED PAID:",
            service._id
          );
        } else {
          console.error(
            "❌ WEBHOOK PAYMENT VALIDATION FAILED"
          );
        }
      }
    }

    // ========================================================
    // PAYMENT FAILED
    // ========================================================

    if (
      event ===
      "payment.failed"
    ) {
      const paymentEntity =
        payload
          .payload
          ?.payment
          ?.entity;

      if (
        paymentEntity
      ) {
        const razorpayPaymentId =
          safeString(
            paymentEntity.id
          );

        const razorpayOrderId =
          safeString(
            paymentEntity.order_id
          );

        // ----------------------------------------------------
        // FIND PAYMENT RECORD
        // ----------------------------------------------------

        if (
          razorpayPaymentId
        ) {
          const existingPayment =
            await Payment.findOne({
              paymentId:
                razorpayPaymentId,
            });

          if (
            existingPayment &&
            existingPayment.status !==
              "Success"
          ) {
            existingPayment.status =
              "Failed";

            existingPayment.razorpayStatus =
              "failed";

            await existingPayment.save();
          }
        }

        // ----------------------------------------------------
        // FIND MEDICINE ORDER
        // ----------------------------------------------------

        if (
          razorpayOrderId
        ) {
          let service =
            await Order.findOne({
              razorpayOrderId,
            });

          // --------------------------------------------------
          // TRY LAB
          // --------------------------------------------------

          if (!service) {
            const LabOrder =
              getLabOrderModel();

            service =
              await LabOrder.findOne({
                razorpayOrderId,
              });
          }

          // --------------------------------------------------
          // MARK FAILED
          //
          // Never overwrite an already-paid order.
          // --------------------------------------------------

          if (
            service &&
            service.paymentStatus !==
              "Paid"
          ) {
            service.paymentStatus =
              "Failed";

            await service.save();

            console.log(
              "⚠️ PAYMENT FAILED:",
              service._id
            );
          }
        }
      }
    }

    // ========================================================
    // OTHER EVENTS
    // ========================================================

    if (
      event ===
      "payment.authorized"
    ) {
      console.log(
        "ℹ️ RAZORPAY PAYMENT AUTHORIZED"
      );
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
      "❌ RAZORPAY WEBHOOK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed.",
    });
  }
};