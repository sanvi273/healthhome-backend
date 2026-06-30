const Cart = require("../models/cartModel");


// Add Medicine
const addToCart = async (req, res) => {
  try {

    const cart = await Cart.create(req.body);

    res.json(cart);

  } catch (e) {

    res.status(500).json({
      message: e.toString(),
    });

  }
};


// Get Patient Cart
const getCart = async (req, res) => {

  try {

    const cart = await Cart.find({
      patientId: req.params.patientId,
    });

    res.json(cart);

  } catch (e) {

    res.status(500).json({
      message: e.toString(),
    });

  }

};


// Delete Item
const deleteItem = async (req, res) => {

  try {

    await Cart.findByIdAndDelete(req.params.id);

    res.json({
      message: "Deleted",
    });

  } catch (e) {

    res.status(500).json({
      message: e.toString(),
    });

  }

};

module.exports = {

  addToCart,
  getCart,
  deleteItem,

};