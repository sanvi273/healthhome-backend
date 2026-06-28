const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ================= REGISTER USER =================

const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            role,
            phone
        } = req.body;

        // CHECK EMAIL EXISTS
        const emailExists = await User.findOne({ email });

        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // CHECK PHONE EXISTS
        const phoneExists = await User.findOne({ phone });

        if (phoneExists) {
            return res.status(400).json({
                success: false,
                message: "Phone number already exists",
            });
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


// ================= LOGIN USER =================

const loginUser = async (req, res) => {

    try {

        const { phone, password } = req.body;

        // FIND USER BY PHONE
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // CHECK PASSWORD
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid password",
            });
        }

        // CREATE JWT TOKEN
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ================= UPDATE ONESIGNAL ID =================

const updateOneSignalId = async (req, res) => {

    try {

        const { phone, oneSignalId } = req.body;

        const user = await User.findOneAndUpdate(

            { phone },

            {
                oneSignalId: oneSignalId,
            },

            { new: true }

        );

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User not found",

            });

        }

        res.status(200).json({

            success: true,

            message: "OneSignal ID Updated",

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ================= EXPORTS =================

module.exports = {
    registerUser,
    loginUser,
    updateOneSignalId,
};