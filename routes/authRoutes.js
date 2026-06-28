const express = require("express");

console.log("✅ authRoutes.js loaded");

const {
    registerUser,
    loginUser,
    updateOneSignalId,
} = require("../controllers/authController");

const router = express.Router();

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// UPDATE ONESIGNAL ID
router.put(
    "/update-onesignal",
    updateOneSignalId,
);

module.exports = router;