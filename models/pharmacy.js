const mongoose = require("mongoose");

const pharmacySchema =
new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },

  shopType: {
    type: String,
    required: true,
  },

  experience: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

 phone: {
  type: String,
  required: true,
  unique: true,
},

  rating: {
    type: Number,
    default: 4.5,
  },

  available: {
    type: Boolean,
    default: true,
  },

  image: {
    type: String,
    default: "",
  },

  city: {
  type: String,
  required: true,
},

}, {
  timestamps: true,
});

module.exports =
mongoose.model(
  "Pharmacy",
  pharmacySchema
);