const Cart = require("../models/cartModel");

// ADD TO CART

const addToCart = async (req, res) => {
  try {
    const {
      patientPhone,
      medicineId,
      medicineName,
      price,
    } = req.body;

    const cartItem = new Cart({
      patientPhone,
      medicineId,
      medicineName,
      price,
    });

    await cartItem.save();

    res.status(201).json({
      success: true,
      message: "Added To Cart",
      cartItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CART

const getCartItems = async (req, res) => {
  try {
    const items = await Cart.find({
      patientPhone: req.params.phone,
    });

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE CART ITEM

const deleteCartItem = async (
  req,
  res
) => {
  try {
    await Cart.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Item Removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCartItems,
  deleteCartItem,
};