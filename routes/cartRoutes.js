const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  deleteItem,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} = require("../controllers/cartController");

// Add medicine
router.post("/add", addToCart);

// Increase quantity
router.put("/increase/:id", increaseQuantity);

// Decrease quantity
router.put("/decrease/:id", decreaseQuantity);

// Clear patient's cart
router.delete("/clear/:patientPhone", clearCart);

// Delete one cart item
router.delete("/:id", deleteItem);

// Get patient's cart
router.get("/:patientPhone", getCart);

module.exports = router;