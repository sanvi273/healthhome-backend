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

  // ============================================================
  // MSG91 COLLECTION OTP
  // ============================================================
  generateCollectionOtp,
  verifyCollectionOtp,
  getCollectionOtp,
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

router.post(
  "/add",
  addLabOrder
);


// ============================================================
// LAB ORDER LIST
// ============================================================

router.get(
  "/all",
  getLabOrders
);

// ============================================================
// PATIENT GETS COLLECTION OTP
// ============================================================
//
// Used by Patient app to display the same OTP generated
// for the Home Collection order.
//
// IMPORTANT:
// This must be BEFORE /:id
// ============================================================

router.get(
  "/collection-otp/:id",
  getCollectionOtp
);
// ============================================================
// GET SINGLE LAB ORDER
// ============================================================

router.get(
  "/:id",
  getLabOrderById
);


// ============================================================
// LABORATORY WORKFLOW
// ============================================================


// ------------------------------------------------------------
// ACCEPT LAB BOOKING
// ------------------------------------------------------------

router.put(
  "/accept/:id",
  acceptLabOrder
);


// ------------------------------------------------------------
// REJECT LAB BOOKING
// ------------------------------------------------------------

router.put(
  "/reject/:id",
  rejectLabOrder
);


// ------------------------------------------------------------
// ASSIGN SAMPLE COLLECTOR
// ------------------------------------------------------------

router.put(
  "/assign-collector/:id",
  assignSampleCollector
);


// ------------------------------------------------------------
// COLLECTOR ON THE WAY
// ------------------------------------------------------------

router.put(
  "/collector-on-the-way/:id",
  collectorOnTheWay
);


// ============================================================
// COLLECTION OTP
// ============================================================


// ------------------------------------------------------------
// GENERATE + SEND OTP
//
// Patient receives OTP through normal SMS.
// OTP itself is NOT returned to Flutter.
//
// Flow:
// On The Way
//     ↓
// Generate OTP
//     ↓
// MSG91 sends SMS
// ------------------------------------------------------------

router.post(
  "/generate-collection-otp/:id",
  generateCollectionOtp
);


// ------------------------------------------------------------
// VERIFY COLLECTION OTP
//
// Collector enters the OTP received from patient.
//
// Successful verification automatically changes:
// On The Way
//      ↓
// Sample Collected
// ------------------------------------------------------------

router.post(
  "/verify-collection-otp/:id",
  verifyCollectionOtp
);


// ============================================================
// OLD SAMPLE COLLECTED ENDPOINT
//
// IMPORTANT:
// For Home Collection, this controller now requires
// collectionOtpVerified === true.
//
// Flutter should preferably use:
// /verify-collection-otp/:id
//
// after OTP verification.
// ============================================================

router.put(
  "/sample-collected/:id",
  markSampleCollected
);


// ============================================================
// SAMPLE RECEIVED AT LAB
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
// LAB UPLOADS REPORT
// ============================================================

router.put(
  "/report/:id",
  uploadReport
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;