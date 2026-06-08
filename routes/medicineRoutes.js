const express =
require("express");

const router =
express.Router();

const {

  addMedicine,
  getMedicines,

} = require(
  "../controllers/medicineController"
);

router.post(
  "/add",
  addMedicine
);

router.get(
  "/all",
  getMedicines
);

module.exports = router;