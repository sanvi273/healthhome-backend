const LabOrder = require("../models/labOrder");

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

    // ------------------------------------------
    // BASIC VALIDATION
    // ------------------------------------------

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

    // ------------------------------------------
    // COLLECTION MODE
    // ------------------------------------------

    const finalCollectionMode =
      collectionMode === "Visit Laboratory"
        ? "Visit Laboratory"
        : "Home Collection";

    // ------------------------------------------
    // CREATE ORDER
    // ------------------------------------------

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

      // Collector starts empty
      collectorId: "",
      collectorName: "",
      collectorPhone: "",
      collectorStatus: "Not Assigned",

      reportUrl: "",
      reportUploadedAt: null,
    });

    console.log("================================");
    console.log("NEW LAB ORDER CREATED");
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

    const orders =
      await LabOrder.find()
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
      "GET LAB ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// UPDATE STATUS
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
        message: "Status is required",
      });
    }

    const order =
      await LabOrder.findByIdAndUpdate(
        req.params.id,

        {
          status: status,
        },

        {
          new: true,
          runValidators: true,
        }
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    console.log(
      `LAB ORDER ${order._id} STATUS → ${status}`
    );

    return res.status(200).json({
      success: true,
      message: "Lab order status updated",
      order,
    });

  } catch (error) {

    console.error(
      "UPDATE LAB STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// ACCEPT LAB ORDER
// ============================================================

const acceptLabOrder = async (
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
        message: "Lab order not found",
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message:
          `Order cannot be accepted because current status is ${order.status}`,
      });
    }

    order.status = "Accepted";

    await order.save();

    console.log(
      "LAB ORDER ACCEPTED:",
      order._id
    );

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
// REJECT LAB ORDER
// ============================================================

const rejectLabOrder = async (
  req,
  res
) => {

  try {

    const order =
      await LabOrder.findByIdAndUpdate(

        req.params.id,

        {
          status: "Rejected",
        },

        {
          new: true,
          runValidators: true,
        }
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

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
      collectorName,
      collectorPhone,
    } = req.body;

    if (!collectorId ||
        !collectorName) {

      return res.status(400).json({
        success: false,
        message:
          "Collector ID and name are required",
      });
    }

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

    // Collector is only needed
    // for Home Collection

    if (
      order.collectionMode !==
      "Home Collection"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Sample collector is only required for Home Collection",
      });
    }

    if (
      order.status !== "Accepted" &&
      order.status !== "Collector Assigned"
    ) {

      return res.status(400).json({
        success: false,
        message:
          `Collector cannot be assigned when order status is ${order.status}`,
      });
    }

    order.collectorId =
      collectorId;

    order.collectorName =
      collectorName;

    order.collectorPhone =
      collectorPhone || "";

    order.collectorStatus =
      "Assigned";

    order.status =
      "Collector Assigned";

    await order.save();

    console.log("================================");
    console.log("COLLECTOR ASSIGNED");
    console.log("ORDER =", order._id);
    console.log(
      "COLLECTOR =",
      order.collectorName
    );
    console.log(
      "PHONE =",
      order.collectorPhone
    );
    console.log("================================");

    return res.status(200).json({
      success: true,
      message:
        "Sample collector assigned successfully",
      order,
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
        message: "Lab order not found",
      });
    }

    if (
      order.collectionMode !==
      "Home Collection"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "This order is not a Home Collection order",
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

    order.collectorStatus =
      "On The Way";

    order.status =
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
        message: "Lab order not found",
      });
    }

    if (
      order.collectionMode !==
      "Home Collection"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "This order is not a Home Collection order",
      });
    }

    order.collectorStatus =
      "Sample Collected";

    order.status =
      "Sample Collected";

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Sample marked as collected",
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
//
// Used for:
// 1. Home Collection
// 2. Visit Laboratory
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
        message: "Lab order not found",
      });
    }

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
            "Sample must be collected before receiving it",
        });
      }

    } else {

      // Visit Laboratory
      // patient physically brings sample

      if (
        order.status !== "Accepted"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Patient must have an accepted booking before sample can be received",
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
        message: "Lab order not found",
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
// UPLOAD REPORT
// ============================================================

const uploadReport = async (
  req,
  res
) => {

  try {

    const {
      reportUrl,
    } = req.body;

    if (!reportUrl) {

      return res.status(400).json({
        success: false,
        message:
          "Report URL is required",
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

    order.reportUrl =
      reportUrl;

    order.reportUploadedAt =
      new Date();

    order.status =
      "Completed";

    await order.save();

    console.log("================================");
    console.log("LAB REPORT UPLOADED");
    console.log("ORDER =", order._id);
    console.log("REPORT =", order.reportUrl);
    console.log("STATUS =", order.status);
    console.log("================================");

    return res.status(200).json({
      success: true,
      message:
        "Lab report uploaded successfully",
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
// EXPORT
// ============================================================

module.exports = {

  addLabOrder,

  getLabOrders,

  getLabOrderById,

  updateLabOrderStatus,

  acceptLabOrder,

  rejectLabOrder,

  assignSampleCollector,

  collectorOnTheWay,

  markSampleCollected,

  markSampleReceived,

  startTesting,

  uploadReport,
};