const express = require("express");

const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const router = express.Router();

// Add new address
router.post("/add", addAddress);

// Set default address
// PUT /api/addresses/:userId/default/:addressId
router.put("/:userId/default/:addressId", setDefaultAddress);

// Get all addresses of user
// GET /api/addresses/:userId
router.get("/:userId", getAddresses);

// Update address
// PUT /api/addresses/:userId/:addressId
router.put("/:userId/:addressId", updateAddress);

// Delete address
// DELETE /api/addresses/:userId/:addressId
router.delete("/:userId/:addressId", deleteAddress);

module.exports = router;