const express = require("express");

const router = express.Router();

const {

  addToCart,
  getCart,
  deleteItem,

} = require("../controllers/cartController");


router.post("/add", addToCart);

router.get("/:patientPhone", getCart);

router.delete("/:id", deleteItem);

module.exports = router;