const express =
require("express");

const router =
express.Router();

const {

  addMedicine,
  getMedicines,
  deleteMedicine,
  updateMedicine,
  getInventoryStats,

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

router.get(
  "/stats",
  getInventoryStats
);

module.exports = router;