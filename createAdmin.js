const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/user");

const createAdmin = async () => {
  try {
    // =====================================================
    // CONNECT TO MONGODB
    // =====================================================

    await mongoose.connect(process.env.MONGO_URL);

    console.log("✅ MongoDB Connected");

    // =====================================================
    // ADMIN DETAILS
    // =====================================================

    const name = "HealthHome Admin";
    const email = "admin@healthhome.com";
    const phone = "9999999999";
    const password = "Admin@12345";

    // =====================================================
    // CHECK IF ADMIN ALREADY EXISTS
    // =====================================================

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists:");
      console.log({
        name: existingAdmin.name,
        email: existingAdmin.email,
        phone: existingAdmin.phone,
        role: existingAdmin.role,
      });

      await mongoose.connection.close();
      return;
    }

    // =====================================================
    // CHECK EMAIL
    // =====================================================

    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      console.log("❌ Email already exists:", email);
      await mongoose.connection.close();
      return;
    }

    // =====================================================
    // CHECK PHONE
    // =====================================================

    const existingPhone = await User.findOne({
      phone: phone,
    });

    if (existingPhone) {
      console.log("❌ Phone already exists:", phone);
      await mongoose.connection.close();
      return;
    }

    // =====================================================
    // HASH PASSWORD
    // =====================================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // =====================================================
    // CREATE ADMIN
    // =====================================================

    const admin = await User.create({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      phone: phone,

      accountStatus: "ACTIVE",

      verificationStatus: "NOT_REQUIRED",

      verificationId: "",
    });

    // =====================================================
    // SUCCESS
    // =====================================================

    console.log("\n========================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("========================================");

    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Phone:", admin.phone);
    console.log("Role:", admin.role);
    console.log("Account Status:", admin.accountStatus);
    console.log("Verification Status:", admin.verificationStatus);

    console.log("\nAdmin Login Credentials:");
    console.log("Phone:", phone);
    console.log("Password:", password);

    console.log("========================================\n");

    await mongoose.connection.close();

  } catch (error) {
    console.error("❌ CREATE ADMIN ERROR:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();