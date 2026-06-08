const mongoose = require("mongoose");

const medicineSchema =
new mongoose.Schema({

  pharmacyPhone: {
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

  stock: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

}, {
  timestamps: true,
});

module.exports =
mongoose.model(
  "Medicine",
  medicineSchema
);