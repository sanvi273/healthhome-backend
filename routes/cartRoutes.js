const express = require("express");

const router = express.Router();

const {
  addToCart,
  getCartItems,
  deleteCartItem,
} = require(
  "../controllers/cartController"
);

router.post(
  "/add",
  addToCart
);

router.get(
  "/:phone",
  getCartItems
);

router.delete(
  "/:id",
  deleteCartItem
);

module.exports = router;