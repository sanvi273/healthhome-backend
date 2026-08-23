const express = require("express");

const router = express.Router();

const {
  addSampleCollector,
  getSampleCollectors,
  updateSampleCollector,
  deleteSampleCollector,
} = require("../controllers/sampleCollectorController");


// ============================================================
// ADD COLLECTOR
// ============================================================

router.post(
  "/add",
  addSampleCollector
);


// ============================================================
// GET COLLECTORS BY LAB
// ============================================================

router.get(
  "/lab/:labId",
  getSampleCollectors
);


// ============================================================
// UPDATE COLLECTOR
// ============================================================

router.put(
  "/:id",
  updateSampleCollector
);


// ============================================================
// DELETE COLLECTOR
// ============================================================

router.delete(
  "/:id",
  deleteSampleCollector
);


module.exports = router;