const express =
require("express");

const router =
express.Router();

const {

  addMedicine,
  getMedicines,
  deleteMedicine,
  updateMedicine,


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

router.delete(
  "/:id",
  deleteMedicine
);

router.put(
  "/:id",
  updateMedicine
);

module.exports = router;