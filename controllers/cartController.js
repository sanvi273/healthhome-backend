const Cart = require("../models/cartModel");

// =========================
// Add Medicine To Cart
// =========================
const addToCart = async (req, res) => {
  try {
    console.log("========== ADD TO CART ==========");
    console.log(req.body);

    const cart = await Cart.create(req.body);

    console.log("SAVED CART =", cart);

    res.status(201).json({
      success: true,
      message: "Medicine added to cart successfully",
      cart,
    });

  } catch (e) {
    console.log("ADD CART ERROR =", e);

    res.status(500).json({
      success: false,
      message: e.toString(),
    });
  }
};

// =========================
// Get Patient Cart
// =========================
const getCart = async (req, res) => {
  try {
    console.log("PATIENT ID =", req.params.patientPhone);

    const items = await Cart.find({
      patientId: req.params.patientPhone,
    });

    console.log("FOUND ITEMS =", items);

    res.json({
      items,
    });

  } catch (e) {
    console.log(e);

    res.status(500).json({
      message: e.toString(),
    });
  }
};

// =========================
// Delete Cart Item
// =========================
const deleteItem = async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Cart item deleted successfully",
    });
  } catch (e) {
    console.error("DELETE CART ERROR:", e);

    res.status(500).json({
      success: false,
      message: e.toString(),
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  deleteItem,
};