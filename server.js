console.log("THIS IS MY REAL SERVER");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();


// ================= ROUTES IMPORT =================

const authRoutes =
require("./routes/authRoutes");

const doctorRoutes =
require("./routes/doctorRoutes");

const labRoutes =
require("./routes/labRoutes");

const pharmacyRoutes =
require("./routes/pharmacyRoutes");

const appointmentRoutes =
require("./routes/appointmentRoutes");

const profileRoutes =
require("./routes/profileRoutes");

// ================= APP =================

const app = express();


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());


// ================= ROUTES =================

// AUTH ROUTES
app.use(
  "/api/auth",
  authRoutes
);

// DOCTOR ROUTES
app.use(
  "/api/doctors",
  doctorRoutes
);

// LAB ROUTES
app.use(
  "/api/labs",
  labRoutes
);

// PHARMACY ROUTES
app.use(
  "/api/pharmacies",
  pharmacyRoutes
);

// APPOINTMENT ROUTES
app.use(
  "/api/appointments",
  appointmentRoutes
);

// PROFILE ROUTES
app.use(
  "/api/profile",
  profileRoutes
);


// ================= TEST ROUTE =================

app.get("/", (req, res) => {

  res.send(
    "HealthHome Backend Running"
  );
});


// ================= MONGODB CONNECTION =================

mongoose.connect(
  process.env.MONGO_URL
)

.then(() => {

  console.log(
    "MongoDB Connected"
  );
})

.catch((err) => {

  console.log(err);
});


// ================= SERVER START =================

const PORT =
process.env.PORT || 5000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );
  }
);

