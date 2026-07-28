const Profile = require("../models/Profile");

// SAVE OR UPDATE PROFILE
exports.saveProfile = async (req, res) => {
  try {
    const {
      userId,
      name,
      age,
      gender,
      bloodGroup,
      height,
      weight,
      photo,
    } = req.body;

    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        userId,
        name,
        age,
        gender,
        bloodGroup,
        height,
        weight,
        photo,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({
      userId: req.params.userId,
    });

    if (!profile) {
      return res.json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};