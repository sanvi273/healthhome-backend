const bcrypt = require("bcryptjs");
const OTP = require("../models/otp");

// ============================================================
// SEND OTP
// ============================================================

const sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        // ----------------------------------------------------
        // VALIDATE PHONE
        // ----------------------------------------------------

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required",
            });
        }

        const normalizedPhone = String(phone).trim();

        // ----------------------------------------------------
        // GENERATE 6-DIGIT OTP
        // ----------------------------------------------------

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // ----------------------------------------------------
        // HASH OTP
        // ----------------------------------------------------

        const hashedOTP = await bcrypt.hash(otp, 10);

        // ----------------------------------------------------
        // REMOVE OLD OTP
        // ----------------------------------------------------

        await OTP.deleteMany({
            phone: normalizedPhone,
        });

        // ----------------------------------------------------
        // OTP EXPIRY
        // 5 MINUTES
        // ----------------------------------------------------

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // ----------------------------------------------------
        // SAVE OTP
        // ----------------------------------------------------

        await OTP.create({
            phone: normalizedPhone,
            otp: hashedOTP,
            expiresAt: expiresAt,
            attempts: 0,
        });

        // ----------------------------------------------------
        // DEVELOPMENT RESPONSE
        // ----------------------------------------------------
        // IMPORTANT:
        // This is only for testing.
        // Later we will remove this and send the OTP
        // through SMS.
        // ----------------------------------------------------

        console.log(
            `OTP for ${normalizedPhone}: ${otp}`
        );

        return res.status(200).json({
            success: true,
            message: "OTP generated successfully",

            // DEVELOPMENT ONLY
            otp: otp,
        });

    } catch (error) {

        console.error(
            "SEND OTP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    sendOTP,
};