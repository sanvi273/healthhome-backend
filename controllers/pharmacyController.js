const Pharmacy =
  require("../models/pharmacy");


// ================= ADD PHARMACY =================

const addPharmacy = async (req, res) => {

  try {

    const existingPharmacy =
      await Pharmacy.findOne({
        phone: req.body.phone,
      });


    // ================= UPDATE =================

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

        pharmacy:
          existingPharmacy,
      });
    }


    // ================= CREATE =================

    const pharmacy =
      await Pharmacy.create({

        name:
          req.body.name,

        shopType:
          req.body.shopType,

        experience:
          req.body.experience,

        address:
          req.body.address,

        phone:
          req.body.phone,
      });


    return res.status(201).json({

      success: true,

      message:
        "Pharmacy added successfully",

      pharmacy,
    });


  } catch (error) {

    console.error(
      "ADD PHARMACY ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message,
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

      message:
        error.message,
    });
  }
};


// ================= GET SINGLE PHARMACY =================

const getPharmacyProfile = async (
  req,
  res
) => {

  try {

    const pharmacy =
      await Pharmacy.findOne({
        phone:
          req.params.phone,
      });


    if (!pharmacy) {

      return res.status(404).json({

        success: false,

        message:
          "Pharmacy profile not found",
      });
    }


    return res.status(200).json({

      success: true,

      pharmacy:
        pharmacy,
    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};


module.exports = {

  addPharmacy,

  getPharmacies,

  getPharmacyProfile,
};