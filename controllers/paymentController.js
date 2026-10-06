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

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// ============================================================
// HELPERS
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

const safeString = (value) =>
  String(value ?? "").trim();

const getRazorpayErrorDetails = (error) => ({
  message: error?.message || "",
  description:
    error?.error?.description || "",
  code: error?.error?.code || "",
  field: error?.error?.field || "",
  source: error?.error?.source || "",
  step: error?.error?.step || "",
  reason: error?.error?.reason || "",
  statusCode: error?.statusCode || "",
});

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(
    String(id)
  );

const getLabOrderModel = () =>
  require("../models/labOrder");

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
  // Doctor appointment is created AFTER payment,
  // so doctor payment does not have appointment ownership yet.
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
  // Doctor appointment is created AFTER payment.
  // Therefore there is no appointment document to update here.
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
    "razorpaySignature" in
    service
  ) {
    service.razorpaySignature =
      paymentRecord.signature ||
      "";
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
// CLOSE RAZORPAY QR
// ============================================================

const closeQrSafely = async (
  qrId
) => {
  if (!qrId) {
    return;
  }

  try {
    const qr =
      await razorpay.qrCode.fetch(
        qrId
      );

    if (
      qr?.status === "active"
    ) {
      await razorpay.qrCode.close(
        qrId
      );
    }
  } catch (error) {
    console.error(
      "⚠️ QR CLOSE ERROR:",
      getRazorpayErrorDetails(
        error
      )
    );
  }
};

// ============================================================
// CREATE UPI QR PAYMENT
//
// POST
// /api/payment/create-order
//
// Existing route name is intentionally preserved so the
// Flutter application does not immediately break.
//
// Instead of creating a Razorpay Checkout Order,
// this endpoint now creates a Razorpay UPI QR.
// ============================================================

exports.createOrder = async (
  req,
  res
) => {
  console.log(
    "🔥 NEW UPI QR PAYMENT CONTROLLER LOADED"
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
    // RAZORPAY CONFIGURATION
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
    // MEDICINE ONLINE PAYMENT CHECK
    // --------------------------------------------------------

    if (
      serviceType ===
        "Medicine" &&
      serviceData.service
        .paymentMethod !==
        "ONLINE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay can only be used for ONLINE medicine orders.",
      });
    }

    // --------------------------------------------------------
    // ALREADY PAID CHECK
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
    // CHECK EXISTING ACTIVE QR
    // --------------------------------------------------------

    const existingQrPayment =
      await Payment.findOne({
        serviceType,
        serviceId:
          serviceData.serviceId,
        status: "Pending",
        razorpayQrId: {
          $nin: [
            "",
            null,
          ],
        },
      }).sort({
        createdAt: -1,
      });

    if (
      existingQrPayment &&
      existingQrPayment
        .razorpayQrId &&
      existingQrPayment
        .qrStatus === "active"
    ) {
      return res.status(200).json({
        success: true,

        message:
          "Existing active payment QR returned.",

        payment: {
          paymentRecordId:
            String(
              existingQrPayment._id
            ),

          razorpayQrId:
            existingQrPayment
              .razorpayQrId,

          qrImageUrl:
            existingQrPayment
              .razorpayQrImageUrl,

          amount:
            existingQrPayment.amount,

          currency:
            existingQrPayment
              .currency ||
            "INR",

          serviceType,

          serviceId:
            existingQrPayment
              .serviceId,

          status:
            existingQrPayment.status,

          qrStatus:
            existingQrPayment
              .qrStatus,
        },
      });
    }

    // --------------------------------------------------------
    // AMOUNT
    // --------------------------------------------------------

    const amountInPaise =
      Math.round(
        serviceData.amount * 100
      );

    // QR valid for 15 minutes
    const closeBy =
      Math.floor(
        Date.now() / 1000
      ) +
      15 * 60;

    // --------------------------------------------------------
    // CREATE RAZORPAY UPI QR
    // --------------------------------------------------------

    let razorpayQr;

    try {
      razorpayQr =
        await razorpay.qrCode.create(
          {
            type: "upi_qr",

            name:
              `HealthHome ${serviceType}`,

            usage:
              "single_use",

            fixed_amount: true,

            payment_amount:
              amountInPaise,

            description:
              `HealthHome ${serviceType} payment`,

            close_by:
              closeBy,

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
            },
          }
        );
    } catch (error) {
      const details =
        getRazorpayErrorDetails(
          error
        );

      console.error(
        "❌ RAZORPAY QR CREATE ERROR:",
        details
      );

      return res.status(500).json({
        success: false,

        message:
          details.description ||
          details.message ||
          "Unable to create Razorpay UPI QR.",

        code:
          details.code || "",
      });
    }

    // --------------------------------------------------------
    // VALIDATE QR RESPONSE
    // --------------------------------------------------------

    if (
      !razorpayQr ||
      !razorpayQr.id
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay returned an invalid QR response.",
      });
    }

    // --------------------------------------------------------
    // CREATE CENTRAL PAYMENT RECORD
    // --------------------------------------------------------

    const paymentRecord =
      await Payment.create({
        orderReferenceId:
          serviceData.serviceId,

        paymentId: "",

        orderId: "",

        signature: "",

        razorpayQrId:
          razorpayQr.id,

        razorpayQrImageUrl:
          razorpayQr.image_url ||
          "",

        qrStatus:
          razorpayQr.status ||
          "active",

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

        currency: "INR",

        paymentMethod:
          "ONLINE",

        status:
          "Pending",

        razorpayStatus:
          "created",

        settlementStatus:
          "Pending",

        providerId:
          serviceData.providerId,

        providerType:
          serviceData.providerType,

        platformFee:
          Number(
            serviceData.service
              ?.platformFee || 0
          ),

        providerAmount:
          Number(
            serviceData.service
              ?.providerAmount ??
              Math.max(
                0,
                serviceData.amount -
                  Number(
                    serviceData.service
                      ?.platformFee ||
                      0
                  )
              )
          ),

        cashCollected:
          false,

        cashCollectedAt:
          null,
      });

    console.log(
      "=============================================="
    );

    console.log(
      "✅ RAZORPAY UPI QR CREATED"
    );

    console.log(
      "QR ID:",
      razorpayQr.id
    );

    console.log(
      "QR IMAGE:",
      razorpayQr.image_url
    );

    console.log(
      "SERVICE TYPE:",
      serviceType
    );

    console.log(
      "SERVICE ID:",
      serviceData.serviceId
    );

    console.log(
      "AMOUNT:",
      serviceData.amount
    );

    console.log(
      "PAYMENT RECORD:",
      paymentRecord._id
    );

    console.log(
      "=============================================="
    );

    // --------------------------------------------------------
    // RESPONSE TO FLUTTER
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "UPI QR created successfully.",

      payment: {
        paymentRecordId:
          String(
            paymentRecord._id
          ),

        razorpayQrId:
          razorpayQr.id,

        qrImageUrl:
          razorpayQr.image_url,

        qrShortUrl:
          razorpayQr.image_url,

        amount:
          serviceData.amount,

        amountInPaise,

        currency:
          razorpayQr.currency ||
          "INR",

        serviceType,

        serviceId:
          serviceData.serviceId,

        status:
          "Pending",

        qrStatus:
          razorpayQr.status ||
          "active",

        expiresAt:
          new Date(
            closeBy * 1000
          ).toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "❌ CREATE QR PAYMENT SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to create UPI QR payment.",
    });
  }
};

// ============================================================
// VERIFY UPI QR PAYMENT
//
// POST
// /api/payment/verify-payment
//
// QR payment does NOT use Checkout signature verification.
//
// Instead:
// Razorpay QR -> fetch payments -> captured + UPI +
// exact amount -> HealthHome Payment = Success
// ============================================================

exports.verifyPayment = async (
  req,
  res
) => {
  try {
    const {
      razorpayQrId,
      paymentRecordId,
      serviceType,
      serviceId,
    } = req.body;

    const config =
      checkRazorpayConfiguration();

    if (!config.success) {
      return res.status(500).json(
        config
      );
    }

    if (
      !razorpayQrId &&
      !paymentRecordId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "razorpayQrId or paymentRecordId is required.",
      });
    }

    // --------------------------------------------------------
    // FIND PAYMENT RECORD
    // --------------------------------------------------------

    let paymentRecord;

    if (paymentRecordId) {
      if (
        !isValidObjectId(
          paymentRecordId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid paymentRecordId.",
        });
      }

      paymentRecord =
        await Payment.findById(
          paymentRecordId
        );
    }

    if (
      !paymentRecord &&
      razorpayQrId
    ) {
      paymentRecord =
        await Payment.findOne({
          razorpayQrId:
            safeString(
              razorpayQrId
            ),
        }).sort({
          createdAt: -1,
        });
    }

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message:
          "HealthHome QR payment record not found.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE SERVICE
    // --------------------------------------------------------

    if (
      serviceType &&
      paymentRecord.serviceType !==
        serviceType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment service type does not match.",
      });
    }

    if (
      serviceId &&
      String(
        paymentRecord.serviceId
      ) !== String(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment service ID does not match.",
      });
    }

    // --------------------------------------------------------
    // ALREADY SUCCESSFUL
    // --------------------------------------------------------

    if (
      paymentRecord.status ===
        "Success" &&
      paymentRecord.paymentId
    ) {
      return res.status(200).json({
        success: true,

        paid: true,

        message:
          "Payment already verified.",

        payment:
          paymentRecord,
      });
    }

    const qrId =
      paymentRecord.razorpayQrId;

    if (!qrId) {
      return res.status(400).json({
        success: false,
        message:
          "This payment does not have a Razorpay QR ID.",
      });
    }

    // --------------------------------------------------------
    // GET SERVICE
    // --------------------------------------------------------

    let serviceData;

    try {
      serviceData =
        await getServiceData(
          paymentRecord.serviceType,
          paymentRecord.serviceId
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    // --------------------------------------------------------
    // FETCH PAYMENTS FROM RAZORPAY QR
    // --------------------------------------------------------

    let paymentsResponse;

    try {
      paymentsResponse =
        await razorpay.qrCode
          .fetchAllPayments(
            qrId,
            {
              count: 100,
            }
          );
    } catch (error) {
      const details =
        getRazorpayErrorDetails(
          error
        );

      console.error(
        "❌ RAZORPAY QR PAYMENT FETCH ERROR:",
        details
      );

      return res.status(502).json({
        success: false,

        paid: false,

        message:
          details.description ||
          details.message ||
          "Unable to check Razorpay QR payment.",
      });
    }

    const items =
      Array.isArray(
        paymentsResponse?.items
      )
        ? paymentsResponse.items
        : [];

    // --------------------------------------------------------
    // EXPECTED AMOUNT
    // --------------------------------------------------------

    const expectedAmountPaise =
      Math.round(
        serviceData.amount * 100
      );

    // --------------------------------------------------------
    // FIND VALID PAYMENT
    // --------------------------------------------------------

    const validPayment =
      items
        .filter(
          (payment) =>
            payment &&
            payment.status ===
              "captured" &&
            payment.captured ===
              true &&
            payment.method ===
              "upi" &&
            Number(
              payment.amount
            ) ===
              expectedAmountPaise
        )
        .sort(
          (a, b) =>
            Number(
              b.created_at || 0
            ) -
            Number(
              a.created_at || 0
            )
        )[0];

    // --------------------------------------------------------
    // NOT PAID YET
    // --------------------------------------------------------

    if (!validPayment) {
      return res.status(200).json({
        success: true,

        paid: false,

        message:
          "Payment has not been received yet.",

        payment: {
          paymentRecordId:
            String(
              paymentRecord._id
            ),

          razorpayQrId:
            qrId,

          amount:
            serviceData.amount,

          currency:
            "INR",

          status:
            "Pending",
        },
      });
    }

    // --------------------------------------------------------
    // IDEMPOTENCY
    // --------------------------------------------------------

    const existingPayment =
      await Payment.findOne({
        paymentId:
          validPayment.id,
      });

    if (
      existingPayment &&
      String(
        existingPayment._id
      ) !==
        String(
          paymentRecord._id
        )
    ) {
      return res.status(409).json({
        success: false,

        paid: false,

        message:
          "This Razorpay payment is already linked to another HealthHome payment.",
      });
    }

    // --------------------------------------------------------
    // UPDATE CENTRAL PAYMENT
    // --------------------------------------------------------

    paymentRecord.paymentId =
      validPayment.id;

    paymentRecord.orderId =
      safeString(
        validPayment.order_id
      );

    paymentRecord.signature =
      "";

    paymentRecord.status =
      "Success";

    paymentRecord.razorpayStatus =
      validPayment.status;

    paymentRecord.paymentMethod =
      "ONLINE";

    paymentRecord.qrStatus =
      "closed";

    paymentRecord.amount =
      Number(
        validPayment.amount
      ) / 100;

    paymentRecord.currency =
      validPayment.currency ||
      "INR";

    await paymentRecord.save();

    // --------------------------------------------------------
    // MARK SERVICE PAID
    // --------------------------------------------------------

    await markServicePaid(
      serviceData,
      paymentRecord
    );

    // --------------------------------------------------------
    // CLOSE SINGLE-USE QR
    // --------------------------------------------------------

    await closeQrSafely(
      qrId
    );

    console.log(
      "=============================================="
    );

    console.log(
      "✅ QR PAYMENT VERIFIED"
    );

    console.log(
      "PAYMENT ID:",
      validPayment.id
    );

    console.log(
      "QR ID:",
      qrId
    );

    console.log(
      "SERVICE TYPE:",
      paymentRecord.serviceType
    );

    console.log(
      "SERVICE ID:",
      paymentRecord.serviceId
    );

    console.log(
      "AMOUNT:",
      paymentRecord.amount
    );

    console.log(
      "=============================================="
    );

    return res.status(200).json({
      success: true,

      paid: true,

      message:
        "UPI payment verified successfully.",

      payment: {
        paymentId:
          paymentRecord.paymentId,

        paymentRecordId:
          String(
            paymentRecord._id
          ),

        razorpayQrId:
          paymentRecord.razorpayQrId,

        amount:
          paymentRecord.amount,

        currency:
          paymentRecord.currency,

        method:
          "upi",

        status:
          "Success",

        serviceType:
          paymentRecord.serviceType,

        serviceId:
          paymentRecord.serviceId,
      },

      order: {
        id:
          paymentRecord.serviceId,

        totalAmount:
          serviceData.amount,

        paymentStatus:
          "Paid",
      },
    });
  } catch (error) {
    console.error(
      "❌ VERIFY QR PAYMENT SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      paid: false,

      message:
        error?.message ||
        "UPI payment verification failed.",
    });
  }
};

// ============================================================
// GET QR PAYMENT STATUS
//
// GET
// /api/payment/qr-status/:paymentRecordId
//
// Flutter can call this periodically while the patient
// completes the payment from a UPI application.
// ============================================================

exports.getQrPaymentStatus = async (
  req,
  res
) => {
  try {
    const {
      paymentRecordId,
    } = req.params;

    if (
      !isValidObjectId(
        paymentRecordId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment record ID.",
      });
    }

    const paymentRecord =
      await Payment.findById(
        paymentRecordId
      );

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found.",
      });
    }

    // --------------------------------------------------------
    // ALREADY PAID
    // --------------------------------------------------------

    if (
      paymentRecord.status ===
        "Success" &&
      paymentRecord.paymentId
    ) {
      return res.status(200).json({
        success: true,

        paid: true,

        payment:
          paymentRecord,
      });
    }

    if (
      !paymentRecord.razorpayQrId
    ) {
      return res.status(200).json({
        success: true,

        paid: false,

        status:
          paymentRecord.status,

        message:
          "QR has not been created.",
      });
    }

    // --------------------------------------------------------
    // FETCH RAZORPAY PAYMENTS
    // --------------------------------------------------------

    const paymentsResponse =
      await razorpay.qrCode
        .fetchAllPayments(
          paymentRecord
            .razorpayQrId,
          {
            count: 100,
          }
        );

    const serviceData =
      await getServiceData(
        paymentRecord.serviceType,
        paymentRecord.serviceId
      );

    const expectedAmountPaise =
      Math.round(
        serviceData.amount * 100
      );

    const items =
      Array.isArray(
        paymentsResponse?.items
      )
        ? paymentsResponse.items
        : [];

    // --------------------------------------------------------
    // FIND CAPTURED UPI PAYMENT
    // --------------------------------------------------------

    const validPayment =
      items
        .filter(
          (payment) =>
            payment &&
            payment.status ===
              "captured" &&
            payment.captured ===
              true &&
            payment.method ===
              "upi" &&
            Number(
              payment.amount
            ) ===
              expectedAmountPaise
        )
        .sort(
          (a, b) =>
            Number(
              b.created_at || 0
            ) -
            Number(
              a.created_at || 0
            )
        )[0];

    // --------------------------------------------------------
    // STILL WAITING
    // --------------------------------------------------------

    if (!validPayment) {
      return res.status(200).json({
        success: true,

        paid: false,

        status:
          paymentRecord.status,

        payment: {
          paymentRecordId:
            String(
              paymentRecord._id
            ),

          razorpayQrId:
            paymentRecord
              .razorpayQrId,

          amount:
            paymentRecord.amount,

          currency:
            paymentRecord
              .currency ||
            "INR",
        },
      });
    }

    // --------------------------------------------------------
    // IDEMPOTENCY
    // --------------------------------------------------------

    const existing =
      await Payment.findOne({
        paymentId:
          validPayment.id,
      });

    if (
      existing &&
      String(existing._id) !==
        String(
          paymentRecord._id
        )
    ) {
      return res.status(409).json({
        success: false,

        paid: false,

        message:
          "Razorpay payment is already linked to another HealthHome record.",
      });
    }

    // --------------------------------------------------------
    // MARK PAYMENT SUCCESS
    // --------------------------------------------------------

    paymentRecord.paymentId =
      validPayment.id;

    paymentRecord.orderId =
      safeString(
        validPayment.order_id
      );

    paymentRecord.status =
      "Success";

    paymentRecord.razorpayStatus =
      validPayment.status;

    paymentRecord.paymentMethod =
      "ONLINE";

    paymentRecord.qrStatus =
      "closed";

    paymentRecord.amount =
      Number(
        validPayment.amount
      ) / 100;

    paymentRecord.currency =
      validPayment.currency ||
      "INR";

    await paymentRecord.save();

    // --------------------------------------------------------
    // MARK SERVICE PAID
    // --------------------------------------------------------

    await markServicePaid(
      serviceData,
      paymentRecord
    );

    // --------------------------------------------------------
    // CLOSE QR
    // --------------------------------------------------------

    await closeQrSafely(
      paymentRecord
        .razorpayQrId
    );

    return res.status(200).json({
      success: true,

      paid: true,

      message:
        "UPI payment verified successfully.",

      payment: {
        paymentRecordId:
          String(
            paymentRecord._id
          ),

        paymentId:
          paymentRecord.paymentId,

        razorpayQrId:
          paymentRecord
            .razorpayQrId,

        amount:
          paymentRecord.amount,

        currency:
          paymentRecord.currency,

        method:
          "upi",

        status:
          "Success",

        serviceType:
          paymentRecord
            .serviceType,

        serviceId:
          paymentRecord
            .serviceId,
      },
    });
  } catch (error) {
    console.error(
      "❌ QR STATUS ERROR:",
      getRazorpayErrorDetails(
        error
      )
    );

    return res.status(502).json({
      success: false,

      paid: false,

      message:
        "Unable to check Razorpay payment status.",
    });
  }
};

// ============================================================
// CLOSE QR
//
// POST
// /api/payment/close-qr
// ============================================================

exports.closeQr = async (
  req,
  res
) => {
  try {
    const {
      paymentRecordId,
    } = req.body;

    if (
      !paymentRecordId ||
      !isValidObjectId(
        paymentRecordId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid paymentRecordId is required.",
      });
    }

    const paymentRecord =
      await Payment.findById(
        paymentRecordId
      );

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found.",
      });
    }

    if (
      paymentRecord.status ===
      "Success"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Successful payments cannot be closed.",
      });
    }

    if (
      paymentRecord.razorpayQrId
    ) {
      await closeQrSafely(
        paymentRecord
          .razorpayQrId
      );

      paymentRecord.qrStatus =
        "closed";

      await paymentRecord.save();
    }

    return res.status(200).json({
      success: true,

      message:
        "Payment QR closed successfully.",
    });
  } catch (error) {
    console.error(
      "❌ CLOSE QR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Unable to close QR.",
    });
  }
};

// ============================================================
// RAZORPAY WEBHOOK
//
// POST
// /api/payment/webhook
//
// IMPORTANT:
// server.js must use express.raw() for this route.
// ============================================================

exports.webhook = async (
  req,
  res
) => {
  try {
    if (
      !razorpayWebhookSecret
    ) {
      return res.status(500).json({
        success: false,

        message:
          "Razorpay webhook secret is not configured.",
      });
    }

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

    // --------------------------------------------------------
    // GENERATE HMAC
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
      return res.status(400).json({
        success: false,

        message:
          "Invalid webhook signature.",
      });
    }

    // --------------------------------------------------------
    // PARSE WEBHOOK
    // --------------------------------------------------------

    const payload =
      JSON.parse(
        rawBody.toString(
          "utf8"
        )
      );

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

      if (!paymentEntity) {
        return res.status(200).json({
          success: true,

          message:
            "Webhook received without payment entity.",
        });
      }

      const razorpayPaymentId =
        paymentEntity.id;

      const razorpayOrderId =
        paymentEntity.order_id;

      // ------------------------------------------------------
      // QR PAYMENT
      //
      // QR payment can have order_id = null.
      //
      // QR payment is therefore reconciled through:
      // get payments for QR + captured + UPI + exact amount.
      // ------------------------------------------------------

      const existingQrPayment =
        await Payment.findOne({
          paymentId:
            razorpayPaymentId,
        });

      if (
        existingQrPayment
      ) {
        return res.status(200).json({
          success: true,

          message:
            "QR payment webhook received; payment already reconciled.",
        });
      }

      // ------------------------------------------------------
      // OLD ORDER-BASED PAYMENT SUPPORT
      // ------------------------------------------------------

      if (
        razorpayOrderId
      ) {
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

        // ----------------------------------------------------
        // IF NOT MEDICINE -> TRY LAB
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // SERVICE FOUND
        // ----------------------------------------------------

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

          // --------------------------------------------------
          // AMOUNT VALIDATION
          // --------------------------------------------------

          if (
            Number.isFinite(
              expectedAmountPaise
            ) &&
            webhookAmount ===
              expectedAmountPaise &&
            paymentEntity.status ===
              "captured"
          ) {
            const existing =
              await Payment.findOne({
                paymentId:
                  razorpayPaymentId,
              });

            if (!existing) {
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
                    webhookAmount /
                    100,

                  currency:
                    paymentEntity.currency ||
                    "INR",

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

                  platformFee:
                    Number(
                      service.platformFee ||
                        0
                    ),

                  providerAmount:
                    Number(
                      service.providerAmount ??
                        service.totalAmount ??
                        0
                    ),

                  cashCollected:
                    false,

                  cashCollectedAt:
                    null,
                });

              // ----------------------------------------------
              // MARK SERVICE PAID
              // ----------------------------------------------

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
            }
          }
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
        paymentEntity?.order_id
      ) {
        const razorpayOrderId =
          paymentEntity
            .order_id;

        let service =
          await Order.findOne({
            razorpayOrderId,
          });

        // ----------------------------------------------------
        // TRY LAB
        // ----------------------------------------------------

        if (!service) {
          const LabOrder =
            getLabOrderModel();

          service =
            await LabOrder.findOne({
              razorpayOrderId,
            });
        }

        // ----------------------------------------------------
        // MARK FAILED
        // ----------------------------------------------------

        if (
          service &&
          service.paymentStatus !==
            "Paid"
        ) {
          service.paymentStatus =
            "Failed";

          await service.save();
        }
      }
    }

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