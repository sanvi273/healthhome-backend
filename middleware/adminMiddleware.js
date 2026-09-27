const User = require("../models/user");

const adminMiddleware = async (req, res, next) => {
  try {
    // authMiddleware must run before adminMiddleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(req.user.id).select(
      "_id name email phone role accountStatus"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only admin can access admin APIs
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Admin account must also be active
    if (user.accountStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Admin account is suspended",
      });
    }

    req.admin = user;

    next();
  } catch (error) {
    console.error("ADMIN MIDDLEWARE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while checking admin authorization",
    });
  }
};

module.exports = adminMiddleware;