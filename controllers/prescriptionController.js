console.log("🔥 CONTROLLER LOADED");
const PDFDocument = require("pdfkit");
const Prescription = require("../models/prescriptionModel");
const Appointment = require("../models/Appointment");
console.log("===== PRESCRIPTION SCHEMA =====");
console.log(Prescription.schema.obj);
console.log("===============================");

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

const downloadPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Prescription-${id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(22).text("HealthHome Prescription", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(14).text(
      `Doctor : ${prescription.doctorName}`
    );

    doc.text(
      `Patient : ${prescription.patientName}`
    );

    doc.text(
      `Diagnosis : ${prescription.diagnosis}`
    );

    doc.moveDown();

    doc.text("Medicines");

    prescription.medicines.forEach((medicine) => {
      doc.text(
        `• ${medicine.medicine} - ${medicine.dose}`
      );
    });

    doc.end();

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const sendPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Update prescription status
    prescription.status = "SENT";
    await prescription.save();

    // Update appointment
    await Appointment.findByIdAndUpdate(
    prescription.appointmentId,
    {
        prescriptionSent: true,
    }
);

    res.json({
      success: true,
      message: "Prescription sent successfully",
      prescription,
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
module.exports = {
  savePrescription,
  getPatientPrescriptions,
  downloadPrescription,
  sendPrescription,
};