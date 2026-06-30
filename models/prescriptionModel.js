console.log("🔥 NEW MODEL LOADED");

const mongoose = require("mongoose");


const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: String,

    patientId: ObjectId,

    patientName: String,

    patientPhone: String,

    doctorId: ObjectId,

    doctorName: String,

    diagnosis: String,

    symptoms: [String],

    medicines: [
      {
        medicineId: String,
        medicine: String,
        price: String,
        dose: String,
        duration: String,
        food: String,
        instruction: String,
      },
    ],

    labTests: [String],

    advice: String,

    followUpDate: String,

    pdfUrl: String,

    status: {
      type: String,
      default: "SAVED",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Prescription",
  prescriptionSchema
);