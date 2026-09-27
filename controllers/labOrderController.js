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
    // IMPORTANT:
    // NO ₹500 FEE HERE.
    //
    // The patient only uploads the prescription.
    // The laboratory will review it and determine:
    //
    // 1. Required tests
    // 2. Final amount
    //
    // Payment will happen when the sample is collected.
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
    // Prices are calculated ONLY from lab.tests in MongoDB.
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
    //
    // No test names and no amount yet.
    // Laboratory will determine these later.
    // --------------------------------------------------------

    else {
      totalAmount = 0;
      finalTests = [];
    }

    // --------------------------------------------------------
    // CREATE LAB BOOKING
    //
    // For prescription:
    // totalAmount = 0
    // paymentStatus = Pending
    //
    // This means payment has NOT been made yet.
    // The actual payment will happen at sample collection.
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

      // Payment is NOT completed.
      // For prescription bookings it will happen
      // when the sample is collected.
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

    order.status = status;

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

    let reportList = reports;

    // --------------------------------------------------------
    // IF FLUTTER SENDS JSON AS STRING
    // --------------------------------------------------------

    if (
      typeof reports ===
      "string"
    ) {
      try {
        reportList =
          JSON.parse(reports);
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

            // Human-readable name
            reportName:
              reportName,

            // Original uploaded file name
            fileName:
              report.fileName ||
              `Report_Page_${index + 1}`,

            // Cloudinary URL
            fileUrl:
              report.fileUrl,

            // File type
            fileType:
              report.fileType ||
              "unknown",

            // Page number
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
    //
    // findByIdAndUpdate prevents validation of unrelated
    // old fields while updating report information.
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
};