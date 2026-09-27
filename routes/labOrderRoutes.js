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

// Health check
router.get("/test", (req, res) => {
  res.send("Lab order route working");
});

// Patient creates booking
router.post("/add", addLabOrder);

// Existing dashboard list
router.get("/all", getLabOrders);

// Patient/lab can fetch a specific booking
router.get("/:id", getLabOrderById);

// Laboratory workflow
router.put("/accept/:id", acceptLabOrder);
router.put("/reject/:id", rejectLabOrder);

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

// Lab uploads completed reports
router.put(
  "/report/:id",
  uploadReport
);

module.exports = router;
