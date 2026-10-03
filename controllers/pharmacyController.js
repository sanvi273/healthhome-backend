const Pharmacy = require("../models/pharmacy");

console.log("🔥 PHARMACY MODEL LOADED");

console.log(
  "🔥 PHARMACY SCHEMA FIELDS:",
  Object.keys(Pharmacy.schema.paths)
);

console.log(
  "🔥 CITY FIELD:",
  Pharmacy.schema.paths.city
);


// ============================================================
// ADD / UPDATE PHARMACY
// ============================================================

const addPharmacy = async (req, res) => {
  try {

    const existingPharmacy = await Pharmacy.findOne({
      phone: req.body.phone,
    });

    // ============================================================
    // UPDATE EXISTING PHARMACY
    // ============================================================

    if (existingPharmacy) {

      existingPharmacy.name =
        req.body.name;

      existingPharmacy.shopType =
        req.body.shopType;

      existingPharmacy.experience =
        req.body.experience;

      existingPharmacy.address =
        req.body.address;

      // IMPORTANT:
      // Do NOT modify deliveryPartners here.
      //
      // This means existing delivery partners remain safely
      // stored in MongoDB when pharmacy profile is updated.

      await existingPharmacy.save();

      return res.status(200).json({

        success: true,

        message:
          "Pharmacy updated successfully",

        pharmacy:
          existingPharmacy,
      });
    }


    // ============================================================
    // CREATE NEW PHARMACY
    // ============================================================

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


// ============================================================
// GET ALL PHARMACIES
// ============================================================

const getPharmacies = async (req, res) => {

  try {

    const pharmacies =
      await Pharmacy.find();

    res.status(200).json({

      success: true,

      pharmacies,
    });

  } catch (error) {

    console.error(
      "GET PHARMACIES ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};


// ============================================================
// GET SINGLE PHARMACY PROFILE
// ============================================================

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

    console.error(
      "GET PHARMACY PROFILE ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};


// ============================================================
// GET DELIVERY PARTNERS
// ============================================================
//
// GET
// /api/pharmacies/:phone/delivery-partners
//
// This gets the permanent delivery partners belonging
// to a particular pharmacy.
//

const getDeliveryPartners = async (
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
          "Pharmacy not found",
      });
    }


    return res.status(200).json({

      success: true,

      deliveryPartners:
        pharmacy.deliveryPartners || [],
    });


  } catch (error) {

    console.error(
      "GET DELIVERY PARTNERS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};


// ============================================================
// ADD DELIVERY PARTNER
// ============================================================
//
// POST
// /api/pharmacies/:phone/delivery-partners
//
// Body:
// {
//   "name": "Rahul",
//   "phone": "9876543210"
// }
//

const addDeliveryPartner = async (
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
          "Pharmacy not found",
      });
    }


    const {
      name,
      phone,
    } = req.body;


    // ============================================================
    // VALIDATION
    // ============================================================

    if (!name || !phone) {

      return res.status(400).json({

        success: false,

        message:
          "Partner name and phone are required",
      });
    }


    // ============================================================
    // CHECK DUPLICATE PARTNER
    // ============================================================

    const alreadyExists =
      pharmacy.deliveryPartners.some(
        (partner) =>
          partner.phone === phone
      );


    if (alreadyExists) {

      return res.status(409).json({

        success: false,

        message:
          "This delivery partner already exists",
      });
    }


    // ============================================================
    // ADD PARTNER
    // ============================================================

    pharmacy.deliveryPartners.push({

      name:
        name.trim(),

      phone:
        phone.trim(),
    });


    await pharmacy.save();


    // Get the newly added partner
    const newPartner =
      pharmacy.deliveryPartners[
        pharmacy.deliveryPartners.length - 1
      ];


    return res.status(201).json({

      success: true,

      message:
        "Delivery partner added successfully",

      partner:
        newPartner,

      deliveryPartners:
        pharmacy.deliveryPartners,
    });


  } catch (error) {

    console.error(
      "ADD DELIVERY PARTNER ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};


// ============================================================
// DELETE DELIVERY PARTNER
// ============================================================
//
// DELETE
// /api/pharmacies/:phone/delivery-partners/:partnerId
//

const deleteDeliveryPartner = async (
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
          "Pharmacy not found",
      });
    }


    // ============================================================
    // CHECK PARTNER EXISTS
    // ============================================================

    const partnerExists =
      pharmacy.deliveryPartners.some(
        (partner) =>
          partner._id.toString() ===
          req.params.partnerId
      );


    if (!partnerExists) {

      return res.status(404).json({

        success: false,

        message:
          "Delivery partner not found",
      });
    }


    // ============================================================
    // DELETE PARTNER
    // ============================================================

    pharmacy.deliveryPartners =
      pharmacy.deliveryPartners.filter(
        (partner) =>
          partner._id.toString() !==
          req.params.partnerId
      );


    await pharmacy.save();


    return res.status(200).json({

      success: true,

      message:
        "Delivery partner deleted successfully",

      deliveryPartners:
        pharmacy.deliveryPartners,
    });


  } catch (error) {

    console.error(
      "DELETE DELIVERY PARTNER ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message,
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  addPharmacy,

  getPharmacies,

  getPharmacyProfile,

  getDeliveryPartners,

  addDeliveryPartner,

  deleteDeliveryPartner,
};