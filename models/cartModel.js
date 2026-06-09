const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    patientPhone: {
      type: String,
      required: true,
    },

    medicineId: {
      type: String,
      required: true,
    },

    medicineName: {
      type: String,
      required: true,
    },

    price: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Cart",
  cartSchema
);