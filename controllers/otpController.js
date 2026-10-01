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
// VERIFY OTP
// ============================================================

const verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone number and OTP are required",
            });
        }

        const normalizedPhone = String(phone).trim();
        const enteredOTP = String(otp).trim();

        // ----------------------------------------------------
        // FIND OTP
        // ----------------------------------------------------

        const otpRecord = await OTP.findOne({
            phone: normalizedPhone,
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found or expired",
            });
        }

        // ----------------------------------------------------
        // CHECK EXPIRY
        // ----------------------------------------------------

        if (new Date() > otpRecord.expiresAt) {

            await OTP.deleteOne({
                _id: otpRecord._id,
            });

            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // ----------------------------------------------------
        // CHECK ATTEMPTS
        // ----------------------------------------------------

        if (otpRecord.attempts >= 5) {

            await OTP.deleteOne({
                _id: otpRecord._id,
            });

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        // ----------------------------------------------------
        // COMPARE OTP
        // ----------------------------------------------------

        const isValid = await bcrypt.compare(
            enteredOTP,
            otpRecord.otp
        );

        // ----------------------------------------------------
        // INVALID OTP
        // ----------------------------------------------------

        if (!isValid) {

            otpRecord.attempts += 1;

            await otpRecord.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
                attemptsRemaining: 5 - otpRecord.attempts,
            });
        }

        // ----------------------------------------------------
        // OTP VERIFIED
        // ----------------------------------------------------

        await OTP.deleteOne({
            _id: otpRecord._id,
        });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });

    } catch (error) {

        console.error(
            "VERIFY OTP ERROR:",
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
    verifyOTP,
};