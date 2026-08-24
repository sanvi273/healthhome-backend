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
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!patientId || !patientName) {
      return res.status(400).json({
        success: false,
        message: "Patient information is required",
      });
    }

    if (!labId || !labName) {
      return res.status(400).json({
        success: false,
        message: "Laboratory information is required",
      });
    }

    // --------------------------------------------------------
    // COLLECTION MODE
    // --------------------------------------------------------

    const finalCollectionMode =
      collectionMode === "Visit Laboratory"
        ? "Visit Laboratory"
        : "Home Collection";

    // --------------------------------------------------------
    // CREATE ORDER
    // --------------------------------------------------------

    const order = await LabOrder.create({
      patientId,
      patientName,
      patientPhone: patientPhone || "",
      doctorName: doctorName || "",

      tests: Array.isArray(tests)
        ? tests
        : [],

      labId,
      labName,

      address: address || "",
      notes: notes || "",

      prescriptionImage:
        prescriptionImage || "",

      collectionMode:
        finalCollectionMode,

      status: "Pending",

      collectorId: "",
      collectorName: "",
      collectorPhone: "",
      collectorStatus: "Not Assigned",

      reports: [],
reportUploadedAt: null,
    });

    console.log("================================");
    console.log("NEW LAB ORDER");
    console.log("ORDER ID =", order._id);
    console.log("PATIENT =", order.patientName);
    console.log("LAB =", order.labName);
    console.log(
      "COLLECTION MODE =",
      order.collectionMode
    );
    console.log("STATUS =", order.status);
    console.log("================================");

    return res.status(201).json({
      success: true,
      message: "Lab order created successfully",
      order,
    });

  } catch (error) {
    console.error(
      "ADD LAB ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// GET ALL LAB ORDERS
// ============================================================

const getLabOrders = async (req, res) => {
  try {
    const orders = await LabOrder
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
      collector.status !== "Active"
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
    // ASSIGN COLLECTOR TO ORDER
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

    // Keep collectorStatus synchronized
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
// Supports:
// 1. Multiple images
// 2. PDF
// ============================================================

const uploadReport = async (req, res) => {
  try {
    const { reports } = req.body;

    // --------------------------------------------------------
    // VALIDATE REPORTS
    // --------------------------------------------------------

    if (!reports) {
      return res.status(400).json({
        success: false,
        message: "Reports are required",
      });
    }

    let reportList = reports;

    // If Flutter sends JSON as a string
    if (typeof reports === "string") {
      try {
        reportList = JSON.parse(reports);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid reports format",
        });
      }
    }

    if (!Array.isArray(reportList) || reportList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one report file is required",
      });
    }

    // --------------------------------------------------------
    // FIND ORDER
    // --------------------------------------------------------

    const order = await LabOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    // --------------------------------------------------------
    // CHECK STATUS
    // --------------------------------------------------------

    if (order.status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message:
          "Testing must be in progress before uploading report",
      });
    }

    // --------------------------------------------------------
    // VALIDATE EACH REPORT
    // --------------------------------------------------------

    const cleanedReports = reportList.map((report, index) => {
      if (!report.fileUrl) {
        throw new Error(
          `Report file URL is missing for page ${index + 1}`
        );
      }

      return {
        fileName: report.fileName || `Report_Page_${index + 1}`,
        fileUrl: report.fileUrl,
        fileType: report.fileType || "unknown",
        pageNumber: Number(report.pageNumber) || index + 1,
      };
    });

    // --------------------------------------------------------
    // SAVE REPORTS
    // --------------------------------------------------------

    order.reports = cleanedReports;

    order.reportUploadedAt = new Date();

    // Report is now ready
    order.status = "Completed";

    await order.save();

    console.log("================================");
    console.log("LAB REPORT UPLOADED");
    console.log("ORDER ID =", order._id);
    console.log("TOTAL REPORT FILES =", order.reports.length);

    order.reports.forEach((report) => {
      console.log(
        `PAGE ${report.pageNumber}:`,
        report.fileName
      );
    });

    console.log("STATUS =", order.status);
    console.log("================================");

    return res.status(200).json({
      success: true,
      message: "Lab report uploaded successfully",
      order,
    });
  } catch (error) {
    console.error(
      "UPLOAD REPORT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
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