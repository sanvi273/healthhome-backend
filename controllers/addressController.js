const User = require("../models/user");

// ============================================================
// ADD NEW ADDRESS
// ============================================================

exports.addAddress = async (req, res) => {
  try {
    const {
      userId,
      label,
      fullAddress,
      landmark,
      city,
      state,
      pincode,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !userId ||
      !label ||
      !fullAddress ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, label, address, city, state and pincode are required",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // DEFAULT ADDRESS
    //
    // If this address is default,
    // make all previous addresses non-default.
    // ========================================================

    if (isDefault === true) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    // ========================================================
    // IF THIS IS THE FIRST ADDRESS
    //
    // Automatically make it default.
    // ========================================================

    const makeDefault =
      user.addresses.length === 0
        ? true
        : isDefault === true;

    // ========================================================
    // CREATE ADDRESS
    // ========================================================

    user.addresses.push({
      label: label.trim(),

      fullAddress: fullAddress.trim(),

      landmark:
        landmark?.toString().trim() || "",

      city: city.trim(),

      state: state.trim(),

      pincode: pincode.trim(),

      latitude:
        latitude !== undefined &&
        latitude !== null
          ? Number(latitude)
          : null,

      longitude:
        longitude !== undefined &&
        longitude !== null
          ? Number(longitude)
          : null,

      isDefault: makeDefault,
    });

    await user.save();

    // Get the newly added address
    const newAddress =
      user.addresses[
        user.addresses.length - 1
      ];

    return res.status(201).json({
      success: true,

      message:
        "Address added successfully",

      address: newAddress,

      addresses:
        user.addresses,
    });
  } catch (error) {
    console.log(
      "ADD ADDRESS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ============================================================
// GET ALL USER ADDRESSES
// ============================================================

exports.getAddresses = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(
      userId
    ).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      addresses:
        user.addresses || [],
    });
  } catch (error) {
    console.log(
      "GET ADDRESSES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ============================================================
// UPDATE ADDRESS
// ============================================================

exports.updateAddress = async (
  req,
  res
) => {
  try {
    const {
      userId,
      addressId,
    } = req.params;

    const {
      label,
      fullAddress,
      landmark,
      city,
      state,
      pincode,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,

        message:
          "User ID and address ID are required",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(
      userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    // ========================================================
    // FIND ADDRESS
    // ========================================================

    const address =
      user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,

        message:
          "Address not found",
      });
    }

    // ========================================================
    // UPDATE DEFAULT
    // ========================================================

    if (isDefault === true) {
      user.addresses.forEach(
        (item) => {
          item.isDefault = false;
        }
      );
    }

    // ========================================================
    // UPDATE FIELDS
    // ========================================================

    if (label !== undefined) {
      address.label =
        label.toString().trim();
    }

    if (fullAddress !== undefined) {
      address.fullAddress =
        fullAddress.toString().trim();
    }

    if (landmark !== undefined) {
      address.landmark =
        landmark.toString().trim();
    }

    if (city !== undefined) {
      address.city =
        city.toString().trim();
    }

    if (state !== undefined) {
      address.state =
        state.toString().trim();
    }

    if (pincode !== undefined) {
      address.pincode =
        pincode.toString().trim();
    }

    if (
      latitude !== undefined
    ) {
      address.latitude =
        latitude === null
          ? null
          : Number(latitude);
    }

    if (
      longitude !== undefined
    ) {
      address.longitude =
        longitude === null
          ? null
          : Number(longitude);
    }

    if (isDefault !== undefined) {
      address.isDefault =
        Boolean(isDefault);
    }

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "Address updated successfully",

      address,

      addresses:
        user.addresses,
    });
  } catch (error) {
    console.log(
      "UPDATE ADDRESS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ============================================================
// DELETE ADDRESS
// ============================================================

exports.deleteAddress = async (
  req,
  res
) => {
  try {
    const {
      userId,
      addressId,
    } = req.params;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,

        message:
          "User ID and address ID are required",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(
      userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    // ========================================================
    // FIND ADDRESS
    // ========================================================

    const address =
      user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,

        message:
          "Address not found",
      });
    }

    const wasDefault =
      address.isDefault;

    // ========================================================
    // DELETE
    // ========================================================

    address.deleteOne();

    // ========================================================
    // IF DEFAULT ADDRESS WAS DELETED
    //
    // Make another address default.
    // ========================================================

    if (
      wasDefault &&
      user.addresses.length > 0
    ) {
      user.addresses[0].isDefault =
        true;
    }

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "Address deleted successfully",

      addresses:
        user.addresses,
    });
  } catch (error) {
    console.log(
      "DELETE ADDRESS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ============================================================
// SET DEFAULT ADDRESS
// ============================================================

exports.setDefaultAddress =
  async (req, res) => {
    try {
      const {
        userId,
        addressId,
      } = req.params;

      // ======================================================
      // VALIDATION
      // ======================================================

      if (!userId || !addressId) {
        return res.status(400).json({
          success: false,

          message:
            "User ID and address ID are required",
        });
      }

      // ======================================================
      // FIND USER
      // ======================================================

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "User not found",
        });
      }

      // ======================================================
      // FIND ADDRESS
      // ======================================================

      const address =
        user.addresses.id(addressId);

      if (!address) {
        return res.status(404).json({
          success: false,

          message:
            "Address not found",
        });
      }

      // ======================================================
      // REMOVE DEFAULT FROM ALL
      // ======================================================

      user.addresses.forEach(
        (item) => {
          item.isDefault = false;
        }
      );

      // ======================================================
      // SET NEW DEFAULT
      // ======================================================

      address.isDefault = true;

      await user.save();

      return res.status(200).json({
        success: true,

        message:
          "Default address updated successfully",

        address,

        addresses:
          user.addresses,
      });
    } catch (error) {
      console.log(
        "SET DEFAULT ADDRESS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };