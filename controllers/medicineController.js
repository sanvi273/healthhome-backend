const Medicine = require("../models/medicine");

// ============================================================
// ADD MEDICINE
// ============================================================

const addMedicine = async (req, res) => {
  try {
    console.log("================================");
    console.log("ADD MEDICINE REQUEST");
    console.log("BODY:", req.body);
    console.log("================================");

    const medicine = await Medicine.create({
      pharmacyPhone: req.body.pharmacyPhone,

      medicineName: req.body.medicineName,

      category: req.body.category || "Tablet",

      manufacturer: req.body.manufacturer || "",

      description: req.body.description || "",

      price: Number(req.body.price),

      stock: Number(req.body.stock),

      image: req.body.image || "",

      status: req.body.status || "Available",
    });

    return res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      medicine,
    });
  } catch (error) {
    console.log("ADD MEDICINE ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET ALL MEDICINES
// ============================================================

const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find();

    return res.status(200).json({
      success: true,
      medicines,
    });
  } catch (error) {
    console.log("GET MEDICINES ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET INVENTORY STATS
// ============================================================

const getInventoryStats = async (req, res) => {
  try {
    const medicines = await Medicine.find();

    const total = medicines.length;

    const lowStock = medicines.filter(
      (medicine) => medicine.stock < 10
    ).length;

    const outOfStock = medicines.filter(
      (medicine) => medicine.stock <= 0
    ).length;

    const available = medicines.filter(
      (medicine) => medicine.status === "Available"
    ).length;

    return res.status(200).json({
      success: true,
      total,
      lowStock,
      outOfStock,
      available,
    });
  } catch (error) {
    console.log("INVENTORY STATS ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE MEDICINE
// ============================================================

const deleteMedicine = async (req, res) => {
  try {
    console.log("================================");
    console.log("DELETE MEDICINE REQUEST");
    console.log("ID:", req.params.id);
    console.log("================================");

    const medicineId = req.params.id.trim();

    const result = await Medicine.findByIdAndDelete(
      medicineId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    console.log("DELETED MEDICINE:", result);

    return res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.log("DELETE MEDICINE ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE MEDICINE
// ============================================================

const updateMedicine = async (req, res) => {
  try {
    console.log("================================");
    console.log("UPDATE MEDICINE REQUEST");
    console.log("ID:", req.params.id);
    console.log("BODY:", req.body);
    console.log("================================");

    const medicineId = req.params.id.trim();

    const medicine =
      await Medicine.findByIdAndUpdate(
        medicineId,
        {
          medicineName:
            req.body.medicineName,

          category:
            req.body.category,

          manufacturer:
            req.body.manufacturer || "",

          description:
            req.body.description || "",

          price:
            Number(req.body.price),

          stock:
            Number(req.body.stock),

          image:
            req.body.image || "",
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    console.log("UPDATED MEDICINE:", medicine);

    return res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      medicine,
    });
  } catch (error) {
    console.log("UPDATE MEDICINE ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  addMedicine,
  getMedicines,
  deleteMedicine,
  updateMedicine,
  getInventoryStats,
};