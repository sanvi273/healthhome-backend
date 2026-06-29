const express = require("express");

const router = express.Router();

const {
  savePrescription,
  getPatientPrescriptions,
} = require("../controllers/prescriptionController");

// Save Prescription
router.post(
  "/save",
  savePrescription
);

// Get All Prescriptions of Patient
router.get(
  "/patient/:patientId",
  getPatientPrescriptions
);

module.exports = router;