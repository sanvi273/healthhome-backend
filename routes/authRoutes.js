const express = require("express");

console.log("✅ authRoutes.js loaded");

const {
    registerUser,
    loginUser,
    updateOneSignalId,
} = require("../controllers/authController");

const {
    sendOTP,
    verifyOTP,  
} = require("../controllers/otpController");

const router = express.Router();

// ============================================================
// REGISTER
// ============================================================

router.post(
    "/register",
    registerUser
);

// ============================================================
// LOGIN
// ============================================================

router.post(
    "/login",
    loginUser
);

// ============================================================
// SEND OTP
// ============================================================

router.post(
    "/send-otp",
    sendOTP
);

// ============================================================
// VERIFY OTP
// ============================================================

router.post(
    "/verify-otp",
    verifyOTP
);

// ============================================================
// UPDATE ONESIGNAL ID
// ============================================================

router.put(
    "/update-onesignal",
    updateOneSignalId
);

module.exports = router;