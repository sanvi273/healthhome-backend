const Medicine =
require("../models/medicine");

// ================= ADD MEDICINE =================

const addMedicine = async (req, res) => {

try {


const medicine =
await Medicine.create(req.body);

res.status(201).json({

  success: true,

  message:
  "Medicine added successfully",

  medicine,
});


} catch (error) {

res.status(500).json({

  success: false,

  message: error.message,
});


}
};

// ================= GET ALL MEDICINES =================

const getMedicines = async (req, res) => {

  try {

    console.log("GET MEDICINES CALLED");

    const medicines =
      await Medicine.find();

    console.log(medicines);

    res.status(200).json({
      success: true,
      medicines,
    });

  } catch (error) {

    console.log("GET MEDICINES ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE MEDICINE =================

const deleteMedicine = async (req, res) => {
  try {
    console.log("DELETE REQUEST RECEIVED");
    console.log("ID:", req.params.id);

    const result = await Medicine.findByIdAndDelete(
      req.params.id.trim()
    );

    console.log("RESULT:", result);

    return res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });

  } catch (error) {

    console.log("DELETE FULL ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE MEDICINE =================

const updateMedicine = async (req, res) => {
  try {

    console.log("UPDATE REQUEST RECEIVED");
    console.log(req.params.id);
    console.log(req.body);

    const medicine =
      await Medicine.findByIdAndUpdate(
        req.params.id,
        {
          medicineName: req.body.medicineName,
          price: req.body.price,
          stock: req.body.stock,
          description: req.body.description,
        },
        {
          new: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      medicine,
    });

  } catch (error) {

    console.log("UPDATE ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {

addMedicine,
getMedicines,
deleteMedicine,
updateMedicine,
};
