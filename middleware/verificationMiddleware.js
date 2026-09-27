const User = require("../models/user");

const verificationMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // authMiddleware must run before this middleware
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Get latest user information from database
      const user = await User.findById(req.user.id).select(
        "_id name email phone role accountStatus verificationStatus verificationId"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // Check role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this resource",
        });
      }

      // Check account status
      if (user.accountStatus !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Your account is suspended",
        });
      }

      // Patients do not require professional verification
      if (user.role === "patient") {
        req.verifiedUser = user;
        return next();
      }

      // Professional users MUST be approved
      if (user.verificationStatus !== "APPROVED") {
        let message = "Your professional account is not verified";

        if (user.verificationStatus === "PENDING") {
          message =
            "Your verification application is pending admin approval";
        }

        if (user.verificationStatus === "UNDER_REVIEW") {
          message =
            "Your verification application is currently under review";
        }

        if (user.verificationStatus === "REJECTED") {
          message =
            "Your verification application was rejected";
        }

        return res.status(403).json({
          success: false,
          message,
          verificationStatus: user.verificationStatus,
          verificationId: user.verificationId,
        });
      }

      // Everything is valid
      req.verifiedUser = user;

      next();
    } catch (error) {
      console.error(
        "VERIFICATION MIDDLEWARE ERROR:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Server error while checking verification",
      });
    }
  };
};

module.exports = verificationMiddleware;