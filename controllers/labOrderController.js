const LabOrder = require("../models/labOrder");
const SampleCollector = require("../models/sampleCollector");

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
      String(bookingType || "TEST").toUpperCase() === "PRESCRIPTION"
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

      patientName:
        String(patientName).trim(),

      patientPhone:
        String(patientPhone || "").trim(),

      doctorName:
        String(doctorName || "").trim(),

      bookingType:
        finalBookingType,

      tests:
        finalTests,

      labId:
        String(lab._id),

      labName:
        String(lab.name || ""),

      address:
        String(address || "").trim(),

      notes:
        String(notes || "").trim(),

      totalAmount:
        totalAmount,

      paymentStatus:
        "Pending",

      razorpayOrderId:
        "",

      razorpayPaymentId:
        "",

      razorpaySignature:
        "",

      paymentRecordId:
        "",

      prescriptionImage:
        String(prescriptionImage || "").trim(),

      collectionMode:
        finalCollectionMode,

      collectorId:
        "",

      collectorName:
        "",

      collectorPhone:
        "",

      collectorStatus:
        "Not Assigned",

      status:
        "Pending",

      reports:
        [],

      reportUploadedAt:
        null,
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


// ============================================================
// PREPARE COLLECTION OTP
//
// IMPORTANT:
//
// MSG91 Widget Mobile SDK handles the actual OTP sending.
//
// Flutter:
// 1. Calls this endpoint.
// 2. Calls OTPWidget.sendOTP().
// 3. MSG91 sends SMS directly to patient.
// 4. Flutter receives reqId.
//
// Backend DOES NOT call MSG91 sendOtp anymore.
// ============================================================

const generateCollectionOtp = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const labOrder =
      await LabOrder.findById(
        id
      );

    if (!labOrder) {
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
      labOrder.collectionMode !==
      "Home Collection"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP is required only for Home Collection.",
      });
    }

    // --------------------------------------------------------
    // COLLECTOR MUST BE ON THE WAY
    // --------------------------------------------------------

    if (
      labOrder.status !==
      "On The Way"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP can be sent only when collector is On The Way.",
      });
    }

    // --------------------------------------------------------
    // PATIENT PHONE REQUIRED
    // --------------------------------------------------------

    if (
      !String(
        labOrder.patientPhone || ""
      ).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient phone number is not available.",
      });
    }

    // --------------------------------------------------------
    // START A NEW LOCAL OTP SESSION
    //
    // The actual OTP is managed by MSG91.
    // We NEVER store the OTP itself.
    // --------------------------------------------------------

    labOrder.collectionOtpReqId = "";

    labOrder.collectionOtpExpiresAt =
      new Date(
        Date.now() +
        15 *
          60 *
          1000
      );

    labOrder.collectionOtpAttempts =
      0;

    labOrder.collectionOtpVerified =
      false;

    labOrder.collectionOtpSentAt =
      new Date();

    await labOrder.save();

    return res.status(200).json({
      success: true,

      message:
        "OTP session prepared. Send the OTP using the MSG91 Flutter SDK.",

      expiresAt:
        labOrder.collectionOtpExpiresAt,
    });

  } catch (error) {

    console.error(
      "❌ generateCollectionOtp error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to prepare collection OTP.",
      error:
        error.message,
    });
  }
};


// ============================================================
// VERIFY COLLECTION OTP
//
// IMPORTANT:
//
// Flutter does the actual OTP verification using:
//
// OTPWidget.verifyOTP()
//
// MSG91 returns an access token.
//
// Flutter sends that access token here.
//
// Backend then calls:
//
// MSG91 verifyAccessToken
//
// Backend NEVER receives or stores the actual OTP.
// ============================================================

const verifyCollectionOtp = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const {
      accessToken,
    } = req.body;

    // --------------------------------------------------------
    // FIND LAB ORDER
    // --------------------------------------------------------

    const labOrder =
      await LabOrder.findById(
        id
      );

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found.",
      });
    }

    // --------------------------------------------------------
    // HOME COLLECTION ONLY
    // --------------------------------------------------------

    if (
      labOrder.collectionMode !==
      "Home Collection"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP verification is only required for Home Collection.",
      });
    }

    // --------------------------------------------------------
    // COLLECTOR MUST BE ON THE WAY
    // --------------------------------------------------------

    if (
      labOrder.status !==
      "On The Way"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP can be verified only when collector is On The Way.",
      });
    }

    // --------------------------------------------------------
    // ALREADY VERIFIED
    // --------------------------------------------------------

    if (
      labOrder.collectionOtpVerified ===
      true
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Collection OTP has already been verified.",
      });
    }

    // --------------------------------------------------------
    // ACTIVE OTP SESSION REQUIRED
    // --------------------------------------------------------

    if (
      !labOrder.collectionOtpSentAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No active OTP session found. Please send a new OTP.",
      });
    }

    // --------------------------------------------------------
    // OTP SESSION EXPIRY
    // --------------------------------------------------------

    if (
      labOrder.collectionOtpExpiresAt &&
      new Date() >
        labOrder.collectionOtpExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP session has expired. Please send a new OTP.",
      });
    }

    // --------------------------------------------------------
    // MAX BACKEND VERIFICATION ATTEMPTS
    // --------------------------------------------------------

    if (
      labOrder.collectionOtpAttempts >=
      5
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Maximum OTP verification attempts reached. Please send a new OTP.",
      });
    }

    // --------------------------------------------------------
    // ACCESS TOKEN REQUIRED
    // --------------------------------------------------------

    if (
      !accessToken ||
      typeof accessToken !==
        "string" ||
      !accessToken.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "MSG91 access token is required after OTP verification.",
      });
    }

    // --------------------------------------------------------
    // MSG91 SERVER AUTH KEY
    //
    // NEVER put this key inside Flutter.
    // --------------------------------------------------------

    const authKey =
      process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      return res.status(500).json({
        success: false,
        message:
          "MSG91 server Auth Key is missing.",
      });
    }

    // --------------------------------------------------------
    // VERIFY ACCESS TOKEN WITH MSG91
    // --------------------------------------------------------

    const response =
      await fetch(
        "https://control.msg91.com/api/v5/widget/verifyAccessToken",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams({
              authkey:
                authKey,

              "access-token":
                accessToken.trim(),
            }).toString(),
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch (parseError) {
      data = {};
    }

    // IMPORTANT:
    // Never log accessToken.
    console.log(
      "🔐 MSG91 VERIFY ACCESS TOKEN STATUS:",
      response.status
    );

    console.log(
      "🔐 MSG91 VERIFY ACCESS TOKEN RESPONSE KEYS:",
      Object.keys(
        data || {}
      )
    );

    // --------------------------------------------------------
    // MSG91 TOKEN VERIFICATION FAILED
    // --------------------------------------------------------

    if (
      !response.ok ||
      data.type ===
        "error"
    ) {
      labOrder.collectionOtpAttempts +=
        1;

      await labOrder.save();

      return res.status(400).json({
        success: false,

        message:
          data.message ||
          "MSG91 access token verification failed. Please verify the OTP again.",

        attemptsRemaining:
          Math.max(
            0,
            5 -
              labOrder.collectionOtpAttempts
          ),
      });
    }

    // --------------------------------------------------------
    // EXTRACT VERIFIED MOBILE / IDENTIFIER
    // --------------------------------------------------------

    const findVerifiedPhone = (
      value
    ) => {

      if (
        !value ||
        typeof value !==
          "object"
      ) {
        return null;
      }

      const possibleKeys = [
        "mobile",
        "mobileNumber",
        "phone",
        "phoneNumber",
        "identifier",
        "mobile_number",
        "phone_number",
      ];

      for (
        const key of possibleKeys
      ) {

        if (
          Object.prototype.hasOwnProperty.call(
            value,
            key
          ) &&
          value[key] !==
            null &&
          value[key] !==
            undefined
        ) {

          const raw =
            String(
              value[key]
            ).replace(
              /\D/g,
              ""
            );

          if (
            raw.length >=
            10
          ) {
            return raw;
          }
        }
      }

      for (
        const nestedValue of Object.values(
          value
        )
      ) {

        if (
          nestedValue &&
          typeof nestedValue ===
            "object"
        ) {

          const found =
            findVerifiedPhone(
              nestedValue
            );

          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    const verifiedPhone =
      findVerifiedPhone(
        data
      );

    // --------------------------------------------------------
    // NORMALIZE INDIAN PHONE NUMBERS
    // --------------------------------------------------------

    const normalizeIndianPhone = (
      phone
    ) => {

      const digits =
        String(
          phone || ""
        ).replace(
          /\D/g,
          ""
        );

      if (
        digits.length ===
        10
      ) {
        return digits;
      }

      if (
        digits.length ===
          12 &&
        digits.startsWith(
          "91"
        )
      ) {
        return digits.substring(
          2
        );
      }

      return digits;
    };

    const expectedPhone =
      normalizeIndianPhone(
        labOrder.patientPhone
      );

    // --------------------------------------------------------
    // SECURITY CHECK
    //
    // Token must belong to same patient mobile.
    // --------------------------------------------------------

    if (!verifiedPhone) {

      console.error(
        "❌ MSG91 verification succeeded but verified mobile was not returned."
      );

      return res.status(400).json({
        success: false,
        message:
          "MSG91 verified the token, but the verified mobile number could not be confirmed for this order. Please send a new OTP.",
      });
    }

    const normalizedVerifiedPhone =
      normalizeIndianPhone(
        verifiedPhone
      );

    if (
      !expectedPhone ||
      normalizedVerifiedPhone !==
        expectedPhone
    ) {

      console.error(
        "❌ MSG91 token mobile does not match the lab order patient mobile."
      );

      labOrder.collectionOtpAttempts +=
        1;

      await labOrder.save();

      return res.status(403).json({
        success: false,

        message:
          "OTP verification does not match the patient's registered mobile number for this order.",

        attemptsRemaining:
          Math.max(
            0,
            5 -
              labOrder.collectionOtpAttempts
          ),
      });
    }

    // ========================================================
    // ACCESS TOKEN VERIFIED SUCCESSFULLY
    // ========================================================

    labOrder.collectionOtpVerified =
      true;

    labOrder.collectionOtpReqId =
      "";

    labOrder.collectionOtpExpiresAt =
      null;

    labOrder.collectionOtpAttempts =
      0;

    labOrder.collectionOtpSentAt =
      null;

    // --------------------------------------------------------
    // MOVE ORDER TO SAMPLE COLLECTED
    // --------------------------------------------------------

    labOrder.status =
      "Sample Collected";

    labOrder.collectorStatus =
      "Sample Collected";

    // --------------------------------------------------------
    // FREE COLLECTOR
    // --------------------------------------------------------

    if (
      labOrder.collectorId
    ) {

      await SampleCollector.findByIdAndUpdate(
        labOrder.collectorId,
        {
          availability:
            "Available",
        }
      );
    }

    await labOrder.save();

    console.log(
      "================================"
    );

    console.log(
      "✅ COLLECTION OTP VERIFIED"
    );

    console.log(
      "ORDER ID =",
      labOrder._id.toString()
    );

    console.log(
      "STATUS =",
      labOrder.status
    );

    console.log(
      "COLLECTOR STATUS =",
      labOrder.collectorStatus
    );

    console.log(
      "================================"
    );

    return res.status(200).json({
      success: true,

      message:
        "OTP verified successfully. Sample collection confirmed.",

      status:
        "Sample Collected",

      orderId:
        labOrder._id,
    });

  } catch (error) {

    console.error(
      "❌ verifyCollectionOtp error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to verify collection OTP.",

      error:
        error.message,
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