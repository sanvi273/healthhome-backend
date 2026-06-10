const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({

  pharmacyPhone: {
    type: String,
    required: true,
  },

  medicineName: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    default: "Tablet",
  },

  manufacturer: {
    type: String,
    default: "",
  },

  description: {
    type: String,
    default: "",
  },

  price: {
    type: Number,
    required: true,
  },

  stock: {
    type: Number,
    required: true,
  },

  expiryDate: {
    type: String,
    default: "",
  },

  image: {
    type: String,
    default: "",
  },

  soldCount: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    default: "Available",
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model(
  "Medicine",
  medicineSchema,
);