const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
    },

    patientName: {
      type: String,
      default: "",
    },

    medicineId: {
      type: String,
      default: "",
    },

    medicine: {
      type: String,
      required: true,
    },

    dose: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "",
    },

    food: {
      type: String,
      default: "",
    },

    instruction: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      default: "Pending",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", cartSchema);