const express = require("express");

const router = express.Router();

const {
  addLabOrder,
  getLabOrders,
  updateLabOrderStatus,
  uploadReport,
} = require("../controllers/labOrderController");

router.post(
  "/add",
  addLabOrder
);

router.get(
  "/all",
  getLabOrders
);

router.put(
  "/status/:id",
  updateLabOrderStatus
);

router.put(
  "/report/:id",
  uploadReport
);

module.exports = router;