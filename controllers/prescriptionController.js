const Prescription = require("../models/prescriptionModel");

const savePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.create(req.body);

    res.status(201).json({
      success: true,
      message: "Prescription Saved Successfully",
      prescription,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId,
    }).sort({
      createdAt: -1,
    });

    res.json(prescriptions);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

module.exports = {
  savePrescription,
  getPatientPrescriptions,
};