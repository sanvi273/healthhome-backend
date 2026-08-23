const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/labOrderController");


// ============================================================
// ADD LAB ORDER
// ============================================================

router.post(
  "/add",
  addLabOrder
);


// ============================================================
// GET ALL LAB ORDERS
// ============================================================

router.get(
  "/all",
  getLabOrders
);


// ============================================================
// GET SINGLE LAB ORDER
// ============================================================

router.get(
  "/:id",
  getLabOrderById
);


// ============================================================
// ACCEPT BOOKING
// ============================================================

router.put(
  "/accept/:id",
  acceptLabOrder
);


// ============================================================
// REJECT BOOKING
// ============================================================

router.put(
  "/reject/:id",
  rejectLabOrder
);


// ============================================================
// ASSIGN SAMPLE COLLECTOR
// ============================================================

router.put(
  "/collector/:id",
  assignSampleCollector
);


// ============================================================
// COLLECTOR ON THE WAY
// ============================================================

router.put(
  "/collector-on-way/:id",
  collectorOnTheWay
);


// ============================================================
// SAMPLE COLLECTED
// ============================================================

router.put(
  "/sample-collected/:id",
  markSampleCollected
);


// ============================================================
// SAMPLE RECEIVED
// ============================================================

router.put(
  "/sample-received/:id",
  markSampleReceived
);


// ============================================================
// START TESTING
// ============================================================

router.put(
  "/start-testing/:id",
  startTesting
);


// ============================================================
// GENERAL STATUS UPDATE
// ============================================================

router.put(
  "/status/:id",
  updateLabOrderStatus
);


// ============================================================
// UPLOAD REPORT
// ============================================================

router.put(
  "/report/:id",
  uploadReport
);


module.exports = router;