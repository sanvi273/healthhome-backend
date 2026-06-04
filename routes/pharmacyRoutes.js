const express = require("express");

const router =
express.Router();

const {
  addPharmacy,
  getPharmacies,
} = require(
  "../controllers/pharmacyController"
);


// TEST
router.get("/test", (req, res) => {

  res.send(
    "Pharmacy route working"
  );
});


// ADD PHARMACY
router.post(
  "/add",
  addPharmacy
);


// GET PHARMACIES
router.get(
  "/all",
  getPharmacies
);

module.exports = router;