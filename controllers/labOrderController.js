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
    //
    // TEST         = normal selected-test booking
    // PRESCRIPTION = prescription-based booking
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
    //
    // NO ₹500 FEE HERE.
    //
    // Patient uploads prescription.
    // Laboratory reviews it and determines:
    //
    // 1. Required tests
    // 2. Final amount
    //
    // Payment will happen when sample is collected.
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
    //
    // Prices are calculated ONLY from lab.tests
    // in MongoDB.
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

    // --------------------------------------------------------
    // NORMAL TEST BOOKING
    // --------------------------------------------------------

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
    }

    // --------------------------------------------------------
    // PRESCRIPTION BOOKING
    // --------------------------------------------------------

    else {
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
//
// Supports:
// 1. Multiple images
// 2. PDF
// 3. Custom report names
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

          // --------------------------------------------------
          // CHECK FILE URL
          // --------------------------------------------------

          if (
            !report ||
            !report.fileUrl
          ) {
            throw new Error(
              `Report file URL is missing for page ${index + 1}`
            );
          }

          // --------------------------------------------------
          // CHECK REPORT NAME
          // --------------------------------------------------

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

          // --------------------------------------------------
          // CLEAN REPORT OBJECT
          // --------------------------------------------------

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

    // --------------------------------------------------------
    // CHECK UPDATED ORDER
    // --------------------------------------------------------

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Lab order not found while saving report",
      });
    }

    // --------------------------------------------------------
    // LOG REPORT DETAILS
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

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
// GENERATE + SEND COLLECTION OTP USING MSG91 WIDGET
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
    // OTP ONLY FOR HOME COLLECTION
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
    // OTP ONLY WHEN COLLECTOR IS ON THE WAY
    // --------------------------------------------------------

    if (
      labOrder.status !==
      "On The Way"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP can be generated only when collector is On The Way.",
      });
    }

    // --------------------------------------------------------
    // PATIENT PHONE
    // --------------------------------------------------------

    if (!labOrder.patientPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Patient phone number is not available.",
      });
    }

    // --------------------------------------------------------
    // MSG91 CONFIG
    // --------------------------------------------------------

    const authKey =
      process.env.MSG91_AUTH_KEY;

    const widgetId =
      process.env.MSG91_WIDGET_ID;

    if (!authKey || !widgetId) {
      return res.status(500).json({
        success: false,
        message:
          "MSG91 configuration is missing.",
      });
    }

    // --------------------------------------------------------
    // FORMAT INDIAN MOBILE NUMBER
    // --------------------------------------------------------

    let identifier =
      String(
        labOrder.patientPhone
      ).replace(
        /\D/g,
        ""
      );

    if (
      identifier.length ===
      10
    ) {
      identifier =
        `91${identifier}`;
    }

    // --------------------------------------------------------
    // SEND OTP THROUGH MSG91 WIDGET
    // --------------------------------------------------------

    const response =
      await fetch(
        "https://control.msg91.com/api/v5/widget/sendOtp",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            authkey:
              authKey,
          },

          body:
            JSON.stringify({
              widgetId:
                widgetId,

              identifier:
                identifier,
            }),
        }
      );

    const data =
      await response.json();

    console.log(
      "📲 MSG91 SEND OTP RESPONSE:",
      data
    );

    // --------------------------------------------------------
    // MSG91 ERROR
    // --------------------------------------------------------

    if (
      !response.ok ||
      data.type ===
        "error"
    ) {
      return res.status(400).json({
        success: false,
        message:
          data.message ||
          "Failed to send OTP.",
      });
    }

    // --------------------------------------------------------
    // GET MSG91 REQUEST ID
    // --------------------------------------------------------

    const reqId =
      data.reqId ||
      data.req_id ||
      data.requestId ||
      data.request_id;

    if (!reqId) {
      console.error(
        "❌ MSG91 did not return reqId:",
        data
      );

      return res.status(500).json({
        success: false,
        message:
          "OTP sent but MSG91 request ID was not received.",
      });
    }

    // --------------------------------------------------------
    // STORE OTP SESSION INFORMATION
    //
    // IMPORTANT:
    // We DO NOT store the actual OTP.
    // MSG91 manages the OTP.
    // --------------------------------------------------------

    labOrder.collectionOtpReqId =
      reqId;

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

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Collection OTP sent to patient's registered mobile number.",
    });

  } catch (error) {

    console.error(
      "❌ generateCollectionOtp error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate collection OTP.",
      error:
        error.message,
    });
  }
};


// ============================================================
// VERIFY COLLECTION OTP USING MSG91 WIDGET
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
      otp,
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
      labOrder.collectionOtpVerified
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Collection OTP has already been verified.",
      });
    }

    // --------------------------------------------------------
    // REQUEST ID REQUIRED
    // --------------------------------------------------------

    if (
      !labOrder.collectionOtpReqId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No active OTP found. Please generate a new OTP.",
      });
    }

    // --------------------------------------------------------
    // OTP EXPIRY
    // --------------------------------------------------------

    if (
      labOrder.collectionOtpExpiresAt &&
      new Date() >
        labOrder.collectionOtpExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please generate a new OTP.",
      });
    }

    // --------------------------------------------------------
    // MAX ATTEMPTS
    // --------------------------------------------------------

    if (
      labOrder.collectionOtpAttempts >=
      5
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Maximum OTP attempts reached. Please generate a new OTP.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE OTP FORMAT
    // --------------------------------------------------------

    if (
      !otp ||
      !/^\d{6}$/.test(
        String(otp)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 6-digit OTP.",
      });
    }

    // --------------------------------------------------------
    // MSG91 CONFIG
    // --------------------------------------------------------

    const authKey =
      process.env.MSG91_AUTH_KEY;

    const widgetId =
      process.env.MSG91_WIDGET_ID;

    if (!authKey || !widgetId) {
      return res.status(500).json({
        success: false,
        message:
          "MSG91 configuration is missing.",
      });
    }

    // --------------------------------------------------------
    // VERIFY OTP WITH MSG91
    // --------------------------------------------------------

    const response =
      await fetch(
        "https://control.msg91.com/api/v5/widget/verifyOtp",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            authkey:
              authKey,
          },

          body:
            JSON.stringify({
              widgetId:
                widgetId,

              reqId:
                labOrder.collectionOtpReqId,

              otp:
                String(otp),
            }),
        }
      );

    const data =
      await response.json();

    console.log(
      "🔐 MSG91 VERIFY OTP RESPONSE:",
      data
    );

    // --------------------------------------------------------
    // FAILED OTP
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
          "Invalid OTP.",

        attemptsRemaining:
          Math.max(
            0,
            5 -
              labOrder.collectionOtpAttempts
          ),
      });
    }

    // ========================================================
    // OTP VERIFIED SUCCESSFULLY
    // ========================================================

    labOrder.collectionOtpVerified =
      true;

    labOrder.collectionOtpReqId =
      "";

    labOrder.collectionOtpExpiresAt =
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

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "OTP verified successfully. Sample collection confirmed.",

      status:
        "Sample Collected",
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