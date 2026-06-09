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

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Cart Route Working",
  });
});

router.get(
  "/:phone",
  getCartItems
);

router.delete(
  "/:id",
  deleteCartItem
);

module.exports = router;