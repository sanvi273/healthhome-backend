const Profile = require("../models/Profile");

exports.saveProfile = async (req, res) => {
  try {

    const profile =
      await Profile.create(req.body);

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