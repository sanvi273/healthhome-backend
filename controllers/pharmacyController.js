const Pharmacy =
require("../models/pharmacy");


// ================= ADD PHARMACY =================

const addPharmacy = async (req, res) => {

  try {

    const existingPharmacy =
      await Pharmacy.findOne({
        phone: req.body.phone,
      });

    if (existingPharmacy) {

      existingPharmacy.name =
        req.body.name;

      existingPharmacy.shopType =
        req.body.shopType;

      existingPharmacy.experience =
        req.body.experience;

      existingPharmacy.address =
        req.body.address;

      await existingPharmacy.save();

      return res.status(200).json({

        success: true,

        message:
          "Pharmacy updated successfully",

        pharmacy: existingPharmacy,
      });
    }

    const pharmacy =
      await Pharmacy.create(req.body);

    res.status(201).json({

      success: true,

      message:
        "Pharmacy added successfully",

      pharmacy,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};


// ================= GET ALL PHARMACIES =================

const getPharmacies = async (req, res) => {

  try {

    const pharmacies =
    await Pharmacy.find();

    res.status(200).json({

      success: true,

      pharmacies,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};

module.exports = {

  addPharmacy,
  getPharmacies,
};