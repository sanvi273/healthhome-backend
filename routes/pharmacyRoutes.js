const express = require("express");

const router = express.Router();

const {
  addPharmacy,
  getPharmacies,
  getPharmacyProfile,

  // Delivery Partners
  getDeliveryPartners,
  addDeliveryPartner,
  deleteDeliveryPartner,

} = require("../controllers/pharmacyController");


// ============================================================
// TEST
// ============================================================

router.get(
  "/test",
  (req, res) => {
    res.send("Pharmacy route working");
  }
);


// ============================================================
// ADD PHARMACY
// ============================================================

router.post(
  "/add",
  addPharmacy
);


// ============================================================
// GET ALL PHARMACIES
// ============================================================

router.get(
  "/all",
  getPharmacies
);


// ============================================================
// GET PHARMACY PROFILE BY PHONE
// ============================================================

router.get(
  "/profile/:phone",
  getPharmacyProfile
);


// ============================================================
// DELIVERY PARTNERS
// ============================================================


// ------------------------------------------------------------
// GET DELIVERY PARTNERS
// ------------------------------------------------------------
//
// GET
// /api/pharmacies/:phone/delivery-partners
//
// Example:
// /api/pharmacies/9876543210/delivery-partners
//

router.get(
  "/:phone/delivery-partners",
  getDeliveryPartners
);


// ------------------------------------------------------------
// ADD DELIVERY PARTNER
// ------------------------------------------------------------
//
// POST
// /api/pharmacies/:phone/delivery-partners
//
// Body:
// {
//   "name": "Rahul",
//   "phone": "9876543211"
// }
//

router.post(
  "/:phone/delivery-partners",
  addDeliveryPartner
);


// ------------------------------------------------------------
// DELETE DELIVERY PARTNER
// ------------------------------------------------------------
//
// DELETE
// /api/pharmacies/:phone/delivery-partners/:partnerId
//

router.delete(
  "/:phone/delivery-partners/:partnerId",
  deleteDeliveryPartner
);


module.exports = router;