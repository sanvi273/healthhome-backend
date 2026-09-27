const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/labOrderController");

// ============================================================
// HEALTH CHECK
// ============================================================

router.get("/test", (req, res) => {
  res.send("Lab order route working");
});

// ============================================================
// PATIENT CREATES BOOKING
// ============================================================

router.post("/add", addLabOrder);

// ============================================================
// LAB ORDER LIST
// ============================================================

router.get("/all", getLabOrders);

// ============================================================
// GET SINGLE LAB ORDER
// ============================================================

router.get("/:id", getLabOrderById);

// ============================================================
// LABORATORY WORKFLOW
// ============================================================

router.put(
  "/accept/:id",
  acceptLabOrder
);

router.put(
  "/reject/:id",
  rejectLabOrder
);

router.put(
  "/assign-collector/:id",
  assignSampleCollector
);

router.put(
  "/collector-on-the-way/:id",
  collectorOnTheWay
);

router.put(
  "/sample-collected/:id",
  markSampleCollected
);

router.put(
  "/sample-received/:id",
  markSampleReceived
);

router.put(
  "/start-testing/:id",
  startTesting
);

router.put(
  "/status/:id",
  updateLabOrderStatus
);

// ============================================================
// LAB UPLOADS REPORT
// ============================================================

router.put(
  "/report/:id",
  uploadReport
);

module.exports = router;