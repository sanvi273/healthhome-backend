const express = require("express");

const router = express.Router();

const {
  placeOrder,
  getPharmacyOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

// Place Order
router.post("/place", placeOrder);

router.get("/test/all", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// Pharmacy Orders
router.get("/pharmacy/:pharmacyId", getPharmacyOrders);

// Update Status
router.put("/:id/status", updateOrderStatus);


module.exports = router;