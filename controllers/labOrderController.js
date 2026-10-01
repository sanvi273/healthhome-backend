const LabOrder = require("../models/labOrder");
const SampleCollector = require("../models/sampleCollector");
const crypto = require("crypto");
const axios = require("axios");

// ============================================================
// ADD LAB ORDER
// ============================================================

const addLabOrder = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientPhone,
      doctorName,
      tests,
      labId,
      labName,
      address,
      notes,
      prescriptionImage,
      collectionMode,
      bookingType,
    } = req.body;

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!patientId || !patientName) {
      return res.status(400).json({
        success: false,
        message: "Patient information is required.",
      });
    }

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: "Laboratory ID is required.",
      });
    }

    // --------------------------------------------------------
    // LOAD REAL LAB FROM DATABASE
    // --------------------------------------------------------

    const Lab = require("../models/lab");

    const lab = await Lab.findById(labId);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Laboratory not found.",
      });
    }

    if (lab.available === false) {
      return res.status(400).json({
        success: false,
        message: "This laboratory is currently unavailable.",
      });
    }

    // --------------------------------------------------------
    // BOOKING TYPE
    // --------------------------------------------------------

    const finalBookingType =
      String(bookingType || "TEST").toUpperCase() ===
      "PRESCRIPTION"
        ? "PRESCRIPTION"
        : "TEST";

    // --------------------------------------------------------
    // COLLECTION MODE
    // --------------------------------------------------------

    const finalCollectionMode =
      collectionMode === "Visit Laboratory"
        ? "Visit Laboratory"
        : "Home Collection";

    if (
      finalCollectionMode === "Home Collection" &&
      !String(address || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Home collection address is required.",
      });
    }

    // --------------------------------------------------------
    // PRESCRIPTION BOOKING
    // --------------------------------------------------------

    if (finalBookingType === "PRESCRIPTION") {
      if (!String(prescriptionImage || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Prescription image is required.",
        });
      }
    }

    // --------------------------------------------------------
    // NORMAL TEST BOOKING
    // --------------------------------------------------------

    const requestedTests = Array.isArray(tests)
      ? tests
          .map((test) => String(test || "").trim())
          .filter(Boolean)
      : [];

    const uniqueTestNames = [
      ...new Set(
        requestedTests.map((name) => name.toLowerCase())
      ),
    ];

    let finalTests = [];
    let totalAmount = 0;

    if (finalBookingType === "TEST") {
      if (uniqueTestNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one lab test.",
        });
      }

      const activeTests = Array.isArray(lab.tests)
        ? lab.tests.filter(
            (test) => test.isActive !== false
          )
        : [];

      const matchedTests = [];

      for (const requestedLower of uniqueTestNames) {
        const found = activeTests.find(
          (test) =>
            String(test.testName || "")
              .trim()
              .toLowerCase() === requestedLower
        );

        if (!found) {
          return res.status(400).json({
            success: false,
            message:
              `The selected test "${requestedLower}" is not available at this laboratory.`,
          });
        }

        const price = Number(found.price);

        if (!Number.isFinite(price) || price < 0) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid price configured for lab test "${found.testName}".`,
          });
        }

        matchedTests.push(found);
        totalAmount += price;
      }

      finalTests = matchedTests.map(
        (test) => String(test.testName).trim()
      );
    } else {
      totalAmount = 0;
      finalTests = [];
    }

    // --------------------------------------------------------
    // CREATE LAB BOOKING
    // --------------------------------------------------------

    const order = await LabOrder.create({
      patientId: String(patientId).trim(),

      patientName: String(patientName).trim(),

      patientPhone: String(patientPhone || "").trim(),

      doctorName: String(doctorName || "").trim(),

      bookingType: finalBookingType,

      tests: finalTests,

      labId: String(lab._id),

      labName: String(lab.name || ""),

      address: String(address || "").trim(),

      notes: String(notes || "").trim(),

      totalAmount: totalAmount,

      paymentStatus: "Pending",

      razorpayOrderId: "",

      razorpayPaymentId: "",

      razorpaySignature: "",

      paymentRecordId: "",

      prescriptionImage:
        String(prescriptionImage || "").trim(),

      collectionMode: finalCollectionMode,

      collectorId: "",

      collectorName: "",

      collectorPhone: "",

      collectorStatus: "Not Assigned",

      status: "Pending",

      reports: [],

      reportUploadedAt: null,
    });

    // --------------------------------------------------------
    // LOG
    // --------------------------------------------------------

    console.log("================================");
    console.log("NEW LAB ORDER");
    console.log("ORDER ID =", order._id);
    console.log("PATIENT =", order.patientName);
    console.log("LAB =", order.labName);
    console.log("BOOKING TYPE =", order.bookingType);
    console.log("TESTS =", order.tests);
    console.log("TOTAL AMOUNT =", order.totalAmount);
    console.log("PAYMENT STATUS =", order.paymentStatus);
    console.log("COLLECTION MODE =", order.collectionMode);
    console.log("STATUS =", order.status);
    console.log("================================");

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        finalBookingType === "PRESCRIPTION"
          ? "Lab prescription booking created successfully. Payment will be collected when the sample is taken."
          : "Lab booking created successfully.",

      order,
    });
  } catch (error) {
    console.error(
      "ADD LAB ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to create lab booking.",
    });
  }
};

// ============================================================
// GET ALL LAB ORDERS
// ============================================================

const getLabOrders = async (req, res) => {
  try {
    const orders =
      await LabOrder
        .find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "GET LAB ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET SINGLE LAB ORDER
// ============================================================

const getLabOrderById = async (req, res) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET SINGLE LAB ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ACCEPT LAB BOOKING
// ============================================================

const acceptLabOrder = async (req, res) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message:
          `Order is already ${order.status}`,
      });
    }

    order.status = "Accepted";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Lab booking accepted",
      order,
    });
  } catch (error) {
    console.error(
      "ACCEPT LAB ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// REJECT LAB BOOKING
// ============================================================

const rejectLabOrder = async (req, res) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    order.status = "Rejected";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Lab booking rejected",
      order,
    });
  } catch (error) {
    console.error(
      "REJECT LAB ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ASSIGN SAMPLE COLLECTOR
// ============================================================

const assignSampleCollector = async (
  req,
  res
) => {
  try {
    const {
      collectorId,
    } = req.body;

    if (!collectorId) {
      return res.status(400).json({
        success: false,
        message:
          "Collector ID is required",
      });
    }

    // --------------------------------------------------------
    // FIND ORDER
    // --------------------------------------------------------

    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    // --------------------------------------------------------
    // HOME COLLECTION ONLY
    // --------------------------------------------------------

    if (
      order.collectionMode !==
      "Home Collection"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sample collector is required only for Home Collection",
      });
    }

    // --------------------------------------------------------
    // ORDER MUST BE ACCEPTED
    // --------------------------------------------------------

    if (order.status !== "Accepted") {
      return res.status(400).json({
        success: false,
        message:
          "Booking must be accepted before assigning collector",
      });
    }

    // --------------------------------------------------------
    // FIND COLLECTOR
    // --------------------------------------------------------

    const collector =
      await SampleCollector.findById(
        collectorId
      );

    if (!collector) {
      return res.status(404).json({
        success: false,
        message:
          "Sample collector not found",
      });
    }

    // --------------------------------------------------------
    // COLLECTOR ACTIVE?
    // --------------------------------------------------------

    if (
      collector.status !==
      "Active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This collector is inactive",
      });
    }

    // --------------------------------------------------------
    // COLLECTOR AVAILABLE?
    // --------------------------------------------------------

    if (
      collector.availability !==
      "Available"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This collector is currently busy",
      });
    }

    // --------------------------------------------------------
    // ASSIGN COLLECTOR
    // --------------------------------------------------------

    order.collectorId =
      collector._id.toString();

    order.collectorName =
      collector.name;

    order.collectorPhone =
      collector.phone;

    order.collectorStatus =
      "Assigned";

    order.status =
      "Collector Assigned";

    await order.save();

    // --------------------------------------------------------
    // COLLECTOR BECOMES BUSY
    // --------------------------------------------------------

    collector.availability =
      "Busy";

    await collector.save();

    return res.status(200).json({
      success: true,
      message:
        "Sample collector assigned successfully",
      order,
      collector,
    });
  } catch (error) {
    console.error(
      "ASSIGN COLLECTOR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// COLLECTOR ON THE WAY
// ============================================================

const collectorOnTheWay = async (
  req,
  res
) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    if (
      order.status !==
      "Collector Assigned"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Collector must be assigned first",
      });
    }

    order.status =
      "On The Way";

    order.collectorStatus =
      "On The Way";

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Collector is on the way",
      order,
    });
  } catch (error) {
    console.error(
      "COLLECTOR ON WAY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// SAMPLE COLLECTED
// ============================================================

const markSampleCollected = async (
  req,
  res
) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    if (
      order.status !==
      "On The Way"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Collector must be on the way before sample collection",
      });
    }

    // --------------------------------------------------------
    // HOME COLLECTION REQUIRES OTP
    // --------------------------------------------------------

    if (
      order.collectionMode ===
        "Home Collection" &&
      order.collectionOtpVerified !== true
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP verification is required before marking sample as collected.",
      });
    }

    order.status =
      "Sample Collected";

    order.collectorStatus =
      "Sample Collected";

    await order.save();

    // --------------------------------------------------------
    // COLLECTOR AVAILABLE AGAIN
    // --------------------------------------------------------

    if (order.collectorId) {
      await SampleCollector.findByIdAndUpdate(
        order.collectorId,
        {
          availability:
            "Available",
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Sample collected successfully",
      order,
    });
  } catch (error) {
    console.error(
      "SAMPLE COLLECTED ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// SAMPLE RECEIVED AT LAB
// ============================================================

const markSampleReceived = async (
  req,
  res
) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    // --------------------------------------------------------
    // HOME COLLECTION
    // --------------------------------------------------------

    if (
      order.collectionMode ===
      "Home Collection"
    ) {
      if (
        order.status !==
        "Sample Collected"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sample must be collected before receiving it at the laboratory",
        });
      }
    }

    // --------------------------------------------------------
    // VISIT LABORATORY
    // --------------------------------------------------------

    if (
      order.collectionMode ===
      "Visit Laboratory"
    ) {
      if (
        order.status !==
        "Accepted"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Booking must be accepted before receiving the sample",
        });
      }
    }

    order.status =
      "Sample Received";

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Sample received at laboratory",
      order,
    });
  } catch (error) {
    console.error(
      "SAMPLE RECEIVED ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// START TESTING
// ============================================================

const startTesting = async (
  req,
  res
) => {
  try {
    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    if (
      order.status !==
      "Sample Received"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sample must be received before testing",
      });
    }

    order.status =
      "In Progress";

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Testing started",
      order,
    });
  } catch (error) {
    console.error(
      "START TESTING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GENERAL STATUS UPDATE
// ============================================================

const updateLabOrderStatus = async (
  req,
  res
) => {
  try {
    const {
      status,
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message:
          "Status is required",
      });
    }

    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    // --------------------------------------------------------
    // HOME COLLECTION CANNOT BYPASS OTP
    // --------------------------------------------------------

    if (
      status ===
        "Sample Collected" &&
      order.collectionMode ===
        "Home Collection" &&
      order.collectionOtpVerified !== true
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP verification is required before sample collection.",
      });
    }

    order.status =
      status;

    // --------------------------------------------------------
    // KEEP COLLECTOR STATUS SYNCHRONIZED
    // --------------------------------------------------------

    if (
      status ===
      "Collector Assigned"
    ) {
      order.collectorStatus =
        "Assigned";
    }

    if (
      status ===
      "On The Way"
    ) {
      order.collectorStatus =
        "On The Way";
    }

    if (
      status ===
      "Sample Collected"
    ) {
      order.collectorStatus =
        "Sample Collected";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Lab order status updated",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPLOAD LAB REPORT
// ============================================================

const uploadReport = async (
  req,
  res
) => {
  try {
    const {
      reports,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATE REPORTS
    // --------------------------------------------------------

    if (!reports) {
      return res.status(400).json({
        success: false,
        message:
          "Reports are required",
      });
    }

    let reportList =
      reports;

    // --------------------------------------------------------
    // IF FLUTTER SENDS JSON AS STRING
    // --------------------------------------------------------

    if (
      typeof reports ===
      "string"
    ) {
      try {
        reportList =
          JSON.parse(
            reports
          );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid reports format",
        });
      }
    }

    // --------------------------------------------------------
    // CHECK REPORT ARRAY
    // --------------------------------------------------------

    if (
      !Array.isArray(reportList) ||
      reportList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one report file is required",
      });
    }

    // --------------------------------------------------------
    // FIND ORDER
    // --------------------------------------------------------

    const order =
      await LabOrder.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found",
      });
    }

    // --------------------------------------------------------
    // CHECK STATUS
    // --------------------------------------------------------

    if (
      order.status !==
      "In Progress"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Testing must be in progress before uploading report",
      });
    }

    // --------------------------------------------------------
    // VALIDATE AND CLEAN EACH REPORT
    // --------------------------------------------------------

    const cleanedReports =
      reportList.map(
        (report, index) => {

          if (
            !report ||
            !report.fileUrl
          ) {
            throw new Error(
              `Report file URL is missing for page ${index + 1}`
            );
          }

          const reportName =
            String(
              report.reportName ||
              ""
            ).trim();

          if (!reportName) {
            throw new Error(
              `Report name is missing for page ${index + 1}`
            );
          }

          return {
            reportName:
              reportName,

            fileName:
              report.fileName ||
              `Report_Page_${index + 1}`,

            fileUrl:
              report.fileUrl,

            fileType:
              report.fileType ||
              "unknown",

            pageNumber:
              Number(
                report.pageNumber
              ) ||
              index + 1,
          };
        }
      );

    // --------------------------------------------------------
    // SAVE REPORTS
    // --------------------------------------------------------

    const updatedOrder =
      await LabOrder.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            reports:
              cleanedReports,

            reportUploadedAt:
              new Date(),

            status:
              "Completed",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found while saving report",
      });
    }

    console.log(
      "================================"
    );

    console.log(
      "LAB REPORT UPLOADED"
    );

    console.log(
      "ORDER ID =",
      updatedOrder._id
    );

    console.log(
      "TOTAL REPORT FILES =",
      updatedOrder.reports.length
    );

    updatedOrder.reports.forEach(
      (report) => {

        console.log(
          `PAGE ${report.pageNumber}:`,
          report.reportName,
          "| FILE:",
          report.fileName
        );

      }
    );

    console.log(
      "STATUS =",
      updatedOrder.status
    );

    console.log(
      "================================"
    );

    return res.status(200).json({
      success: true,
      message:
        "Lab report uploaded successfully",
      order:
        updatedOrder,
    });

  } catch (error) {

    console.error(
      "UPLOAD REPORT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ==========================================================
// LAB COLLECTION OTP HELPERS
// ==========================================================

const generateLabOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashLabOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

const normalizeIndianPhone = (phone) => {
  if (!phone) return "";

  let value = String(phone).replace(/\D/g, "");

  // 9876543210 -> 919876543210
  if (value.length === 10) {
    value = `91${value}`;
  }

  // +919876543210 / 919876543210
  if (value.length === 12 && value.startsWith("91")) {
    return value;
  }

  return value;
};


// ==========================================================
// SEND LAB COLLECTION OTP THROUGH MSG91
// ==========================================================

const sendLabCollectionOtp = async (mobile, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is missing");
  }

  if (!templateId) {
    throw new Error("MSG91_OTP_TEMPLATE_ID is missing");
  }

  const phone = normalizeIndianPhone(mobile);

  if (!phone || phone.length !== 12 || !phone.startsWith("91")) {
    throw new Error("Invalid patient mobile number");
  }

  const url =
    `https://control.msg91.com/api/v5/otp` +
    `?template_id=${encodeURIComponent(templateId)}` +
    `&mobile=${encodeURIComponent(phone)}`;

  const response = await axios.post(
    url,
    {
      OTP: otp,
    },
    {
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      timeout: 15000,
    }
  );

  console.log("MSG91 OTP response:", response.data);

  if (
    response.data &&
    response.data.type &&
    response.data.type !== "success"
  ) {
    throw new Error(
      response.data.message || "MSG91 failed to send OTP"
    );
  }

  return response.data;
};


// ==========================================================
// GENERATE LAB COLLECTION OTP
// ==========================================================

const generateCollectionOtp = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("==========================================");
    console.log("LAB COLLECTION OTP REQUEST");
    console.log("Order ID:", id);
    console.log("==========================================");

    const labOrder = await LabOrder.findById(id);

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    // ------------------------------------------------------
    // ONLY HOME COLLECTION
    // ------------------------------------------------------

    if (labOrder.collectionMode !== "Home Collection") {
      return res.status(400).json({
        success: false,
        message: "OTP is required only for Home Collection",
      });
    }

    // ------------------------------------------------------
    // COLLECTOR MUST BE ON THE WAY
    // ------------------------------------------------------

    if (labOrder.status !== "On The Way") {
      return res.status(400).json({
        success: false,
        message:
          "OTP can be generated only when the collector is On The Way",
      });
    }

    // ------------------------------------------------------
    // PATIENT PHONE REQUIRED
    // ------------------------------------------------------

    if (!labOrder.patientPhone) {
      return res.status(400).json({
        success: false,
        message: "Patient phone number is missing",
      });
    }

    // ------------------------------------------------------
    // PREVENT GENERATING OTP AGAIN BEFORE EXPIRY
    // ------------------------------------------------------

    if (
      labOrder.collectionOtpExpiresAt &&
      labOrder.collectionOtpExpiresAt > new Date() &&
      !labOrder.collectionOtpVerified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "An OTP is already active. Please use the existing OTP.",
        expiresAt: labOrder.collectionOtpExpiresAt,
      });
    }

    // ------------------------------------------------------
    // GENERATE 6 DIGIT OTP
    // ------------------------------------------------------

    const otp = generateLabOtp();

    console.log("Lab OTP generated for order:", id);

    // ------------------------------------------------------
    // HASH OTP BEFORE DATABASE STORAGE
    // ------------------------------------------------------

    const otpHash = hashLabOtp(otp);

    // ------------------------------------------------------
    // 10 MINUTE EXPIRY
    // ------------------------------------------------------

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // ------------------------------------------------------
    // RESET OTP SESSION
    // ------------------------------------------------------

    labOrder.collectionOtpHash = otpHash;
    labOrder.collectionOtpExpiresAt = expiresAt;
    labOrder.collectionOtpAttempts = 0;
    labOrder.collectionOtpVerified = false;
    labOrder.collectionOtpSentAt = new Date();

    await labOrder.save();

    // ------------------------------------------------------
    // SEND OTP TO PATIENT
    // ------------------------------------------------------

    try {
      await sendLabCollectionOtp(
        labOrder.patientPhone,
        otp
      );
    } catch (smsError) {
      console.error(
        "MSG91 OTP SEND ERROR:",
        smsError.response?.data || smsError.message
      );

      // Roll back OTP session if SMS failed
      labOrder.collectionOtpHash = "";
      labOrder.collectionOtpExpiresAt = null;
      labOrder.collectionOtpAttempts = 0;
      labOrder.collectionOtpVerified = false;
      labOrder.collectionOtpSentAt = null;

      await labOrder.save();

      return res.status(500).json({
        success: false,
        message: "OTP could not be sent to patient",
        error:
          smsError.response?.data ||
          smsError.message,
      });
    }

    // ------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to patient",
      expiresAt,
    });
  } catch (error) {
    console.error(
      "GENERATE COLLECTION OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate collection OTP",
      error: error.message,
    });
  }
};


// ==========================================================
// VERIFY LAB COLLECTION OTP
// ==========================================================

const verifyCollectionOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    console.log("==========================================");
    console.log("LAB COLLECTION OTP VERIFY REQUEST");
    console.log("Order ID:", id);
    console.log("==========================================");

    // ------------------------------------------------------
    // OTP REQUIRED
    // ------------------------------------------------------

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const enteredOtp = String(otp).trim();

    // ------------------------------------------------------
    // OTP MUST BE 6 DIGITS
    // ------------------------------------------------------

    if (!/^\d{6}$/.test(enteredOtp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must contain exactly 6 digits",
      });
    }

    // ------------------------------------------------------
    // FIND ORDER
    // ------------------------------------------------------

    const labOrder = await LabOrder.findById(id);

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    // ------------------------------------------------------
    // ONLY HOME COLLECTION
    // ------------------------------------------------------

    if (labOrder.collectionMode !== "Home Collection") {
      return res.status(400).json({
        success: false,
        message:
          "OTP verification is required only for Home Collection",
      });
    }

    // ------------------------------------------------------
    // COLLECTOR MUST BE ON THE WAY
    // ------------------------------------------------------

    if (labOrder.status !== "On The Way") {
      return res.status(400).json({
        success: false,
        message:
          "OTP can only be verified when collector is On The Way",
      });
    }

    // ------------------------------------------------------
    // ALREADY VERIFIED
    // ------------------------------------------------------

    if (labOrder.collectionOtpVerified === true) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been verified",
      });
    }

    // ------------------------------------------------------
    // OTP SESSION EXISTS?
    // ------------------------------------------------------

    if (!labOrder.collectionOtpHash) {
      return res.status(400).json({
        success: false,
        message:
          "No active OTP found. Please generate a new OTP.",
      });
    }

    // ------------------------------------------------------
    // EXPIRY CHECK
    // ------------------------------------------------------

    if (
      !labOrder.collectionOtpExpiresAt ||
      labOrder.collectionOtpExpiresAt <= new Date()
    ) {
      labOrder.collectionOtpHash = "";
      labOrder.collectionOtpExpiresAt = null;
      labOrder.collectionOtpAttempts = 0;
      labOrder.collectionOtpSentAt = null;

      await labOrder.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please generate a new OTP.",
      });
    }

    // ------------------------------------------------------
    // MAX ATTEMPTS
    // ------------------------------------------------------

    const MAX_ATTEMPTS = 5;

    if (
      labOrder.collectionOtpAttempts >= MAX_ATTEMPTS
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Maximum OTP attempts exceeded. Please generate a new OTP.",
      });
    }

    // ------------------------------------------------------
    // COUNT ATTEMPT
    // ------------------------------------------------------

    labOrder.collectionOtpAttempts += 1;

    // ------------------------------------------------------
    // HASH ENTERED OTP
    // ------------------------------------------------------

    const enteredOtpHash = hashLabOtp(enteredOtp);

    // ------------------------------------------------------
    // COMPARE HASHES
    // ------------------------------------------------------

    if (
      enteredOtpHash !== labOrder.collectionOtpHash
    ) {
      await labOrder.save();

      const remainingAttempts =
        MAX_ATTEMPTS -
        labOrder.collectionOtpAttempts;

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
        remainingAttempts,
      });
    }

    // ------------------------------------------------------
    // OTP CORRECT
    // ------------------------------------------------------

    labOrder.collectionOtpVerified = true;

    labOrder.status = "Sample Collected";

    labOrder.collectorStatus = "Sample Collected";

    // ------------------------------------------------------
    // CLEAR OTP DATA
    // ------------------------------------------------------

    labOrder.collectionOtpHash = "";
    labOrder.collectionOtpExpiresAt = null;
    labOrder.collectionOtpAttempts = 0;
    labOrder.collectionOtpSentAt = null;

    // ------------------------------------------------------
    // FREE COLLECTOR
    // ------------------------------------------------------

    if (labOrder.collectorId) {
      await SampleCollector.findByIdAndUpdate(
        labOrder.collectorId,
        {
          availability: "Available",
        }
      );
    }

    await labOrder.save();

    console.log(
      "✅ LAB OTP VERIFIED - SAMPLE COLLECTED"
    );

    // ------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Patient verified successfully. Sample collected.",
      status: labOrder.status,
      collectorStatus:
        labOrder.collectorStatus,
    });
  } catch (error) {
    console.error(
      "VERIFY COLLECTION OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify collection OTP",
      error: error.message,
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  addLabOrder,
  getLabOrders,
  getLabOrderById,
  acceptLabOrder,
  rejectLabOrder,
  assignSampleCollector,
  collectorOnTheWay,
  markSampleCollected,
  markSampleReceived,
  startTesting,
  updateLabOrderStatus,
  uploadReport,
  generateCollectionOtp,
  verifyCollectionOtp,
};