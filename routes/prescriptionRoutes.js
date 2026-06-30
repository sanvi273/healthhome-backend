console.log("✅ prescriptionRoutes.js loaded");

const express = require("express");

const {
  savePrescription,
  getPatientPrescriptions,
  downloadPrescription,
  sendPrescription,
} = require("../controllers/prescriptionController");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Prescription Root Working");
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Prescription Test Working",
  });
});

router.post("/save", savePrescription);

router.get(
  "/patient/:patientId",
  getPatientPrescriptions
);

router.get(
  "/pdf/:id",
  downloadPrescription
);

router.put(
  "/send/:id",
  sendPrescription
);

module.exports = router;