console.log("🔥 CONTROLLER LOADED");

const PDFDocument = require("pdfkit");
const Prescription = require("../models/prescriptionModel");
const Appointment = require("../models/Appointment");

console.log("===== PRESCRIPTION SCHEMA =====");
console.log(Prescription.schema.obj);
console.log("===============================");


// ============================================================
// HEALTHHOME PDF HEADER
// ============================================================

function addHealthHomeHeader(doc) {
  const pageWidth = doc.page.width;

  // ==========================================================
  // HEADER BACKGROUND
  // ==========================================================

  doc
    .save()
    .rect(0, 0, pageWidth, 82)
    .fill("#F0FAFA");

  // ==========================================================
  // HEALTHHOME LOGO
  // ==========================================================

  doc
    .roundedRect(
      45,
      18,
      44,
      44,
      11
    )
    .fill("#00C2CB");

  // Medical cross - vertical
  doc
    .fillColor("#FFFFFF")
    .rect(
      61,
      25,
      12,
      30
    )
    .fill();

  // Medical cross - horizontal
  doc
    .fillColor("#FFFFFF")
    .rect(
      52,
      34,
      30,
      12
    )
    .fill();

  // ==========================================================
  // HEALTHHOME NAME
  // ==========================================================

  doc
    .fillColor("#123B40")
    .font("Helvetica-Bold")
    .fontSize(21)
    .text(
      "HealthHome.in",
      103,
      19
    );

  // ==========================================================
  // TAGLINE
  // ==========================================================

  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      "Your Complete Digital Healthcare Platform",
      104,
      45
    );

  // ==========================================================
  // RIGHT SIDE
  // ==========================================================

  doc
    .fillColor("#00AEB8")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      "DIGITAL HEALTHCARE",
      pageWidth - 180,
      29,
      {
        width: 135,
        align: "right",
      }
    );

  // ==========================================================
  // HEADER LINE
  // ==========================================================

  doc
    .moveTo(45, 82)
    .lineTo(pageWidth - 45, 82)
    .lineWidth(1)
    .strokeColor("#00C2CB")
    .stroke();

  doc.restore();
}


// ============================================================
// HEALTHHOME PDF FOOTER
// ============================================================

function addHealthHomeFooter(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc
    .save()
    .moveTo(45, pageHeight - 45)
    .lineTo(pageWidth - 45, pageHeight - 45)
    .lineWidth(0.6)
    .strokeColor("#D9E2E5")
    .stroke();

  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Powered by HealthHome.in",
      45,
      pageHeight - 32
    );

  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Digital Healthcare",
      pageWidth - 145,
      pageHeight - 32,
      {
        width: 100,
        align: "right",
      }
    );

  doc.restore();
}


// ============================================================
// HEALTHHOME ADVERTISEMENT
// ============================================================

function addHealthHomeAdvertisement(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const x = 45;
  const width = pageWidth - 90;

  // Advertisement position
  const y = pageHeight - 135;
  const height = 75;

  // ==========================================================
  // ADVERTISEMENT BOX
  // ==========================================================

  doc
    .save()
    .roundedRect(
      x,
      y,
      width,
      height,
      10
    )
    .fill("#F0FAFA");

  // Left teal strip
  doc
    .roundedRect(
      x,
      y,
      6,
      height,
      3
    )
    .fill("#00C2CB");

  // ==========================================================
  // BRAND NAME
  // ==========================================================

  doc
    .fillColor("#123B40")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(
      "HealthHome.in",
      x + 20,
      y + 10
    );

  // ==========================================================
  // ADVERTISEMENT TITLE
  // ==========================================================

  doc
    .fillColor("#344054")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      "Your Complete Digital Healthcare Platform",
      x + 20,
      y + 30
    );

  // ==========================================================
  // SERVICES
  // ==========================================================

  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Book Doctors  •  Order Medicines  •  Book Lab Tests  •  Access Reports",
      x + 20,
      y + 45,
      {
        width: width - 40,
      }
    );

  // ==========================================================
  // CALL TO ACTION
  // ==========================================================

  doc
    .fillColor("#00AEB8")
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(
      "Healthcare, simplified.   |   HealthHome.in",
      x + 20,
      y + 60
    );

  doc.restore();
}


// ============================================================
// SAVE PRESCRIPTION
// ============================================================

const savePrescription = async (req, res) => {
  try {

    console.log("================================");
    console.log("SAVE PRESCRIPTION REQUEST");
    console.log("BODY:", req.body);
    console.log("LAB TESTS RAW:", req.body.labTests);
    console.log(
      "LAB TESTS TYPE:",
      typeof req.body.labTests
    );
    console.log("================================");


    // --------------------------------------------------------
    // COPY REQUEST
    // --------------------------------------------------------

    const data = {
      ...req.body,
    };


    // --------------------------------------------------------
    // LAB TESTS
    // --------------------------------------------------------

    let labTests = req.body.labTests;


    if (typeof labTests === "string") {
      try {

        labTests = JSON.parse(
          labTests
        );

      } catch (error) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid labTests JSON format.",
        });

      }
    }


    if (!Array.isArray(labTests)) {
      labTests = [];
    }


    data.labTests =
      labTests.map((test) => {

        if (typeof test === "string") {

          return {
            testName: test,
            priority: "Normal",
            note: "",
          };

        }


        return {
          testName:
            test.testName?.toString() ?? "",

          priority:
            test.priority?.toString() ??
            "Normal",

          note:
            test.note?.toString() ?? "",
        };

      });


    // --------------------------------------------------------
    // MEDICINES
    // --------------------------------------------------------

    let medicines =
      req.body.medicines;


    if (typeof medicines === "string") {

      try {

        medicines =
          JSON.parse(medicines);

      } catch (error) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid medicines JSON format.",
        });

      }
    }


    if (!Array.isArray(medicines)) {
      medicines = [];
    }


    data.medicines =
      medicines.map(
        (medicine) => {

          return {

            medicineId:
              medicine.medicineId
                ?.toString() ?? "",

            medicine:
              medicine.medicine
                ?.toString() ?? "",

            price:
              medicine.price
                ?.toString() ?? "",

            dose:
              medicine.dose
                ?.toString() ?? "",

            duration:
              medicine.duration
                ?.toString() ?? "",

            food:
              medicine.food
                ?.toString() ?? "",

            instruction:
              medicine.instruction
                ?.toString() ?? "",

            morning:
              medicine.morning === true,

            afternoon:
              medicine.afternoon === true,

            night:
              medicine.night === true,

          };

        }
      );


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
      "NORMALIZED LAB TESTS:",
      data.labTests
    );

    console.log(
      "NORMALIZED MEDICINES:",
      data.medicines
    );


    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    const prescription =
      await Prescription.create(
        data
      );


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(201).json({

      success: true,

      message:
        "Prescription Saved Successfully",

      prescription,

    });

  } catch (e) {

    console.error(
      "SAVE PRESCRIPTION ERROR:",
      e
    );

    res.status(500).json({

      success: false,
      message: e.message,

    });

  }
};


// ============================================================
// GET PATIENT PRESCRIPTIONS
// ============================================================

const getPatientPrescriptions =
  async (req, res) => {

    try {

      const prescriptions =
        await Prescription.find({
          patientId:
            req.params.patientId,
        }).sort({
          createdAt: -1,
        });


      res.json(
        prescriptions
      );

    } catch (e) {

      res.status(500).json({

        success: false,
        message: e.message,

      });

    }

  };


// ============================================================
// DOWNLOAD PRESCRIPTION PDF
// ============================================================

const downloadPrescription =
  async (req, res) => {

    try {

      const { id } =
        req.params;


      // ========================================================
      // FIND PRESCRIPTION
      // ========================================================

      const prescription =
        await Prescription.findById(
          id
        );


      if (!prescription) {

        return res.status(404).json({

          success: false,

          message:
            "Prescription not found",

        });

      }


      // ========================================================
      // CREATE PDF
      // ========================================================

      const doc =
        new PDFDocument({

          size: "A4",

          margin: 50,

        });


      // ========================================================
      // RESPONSE HEADERS
      // ========================================================

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );


      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Prescription-${id}.pdf`
      );


      // ========================================================
      // CONNECT PDF TO RESPONSE
      // ========================================================

      doc.pipe(res);


      // ========================================================
      // HEALTHHOME HEADER
      // ========================================================

      addHealthHomeHeader(doc);


      // Content starts below header
      doc.y = 105;


      // ========================================================
      // TITLE
      // ========================================================

      doc
        .fillColor("#111111")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(
          "HealthHome Prescription",
          {
            align: "center",
          }
        );


      doc.moveDown();


      // ========================================================
      // PATIENT / DOCTOR
      // ========================================================

      doc
        .fillColor("#111111")
        .font("Helvetica")
        .fontSize(13)
        .text(
          `Doctor : ${
            prescription.doctorName || ""
          }`
        );


      doc.text(
        `Patient : ${
          prescription.patientName || ""
        }`
      );


      doc.text(
        `Phone : ${
          prescription.patientPhone || ""
        }`
      );


      doc.text(
        `Diagnosis : ${
          prescription.diagnosis || ""
        }`
      );


      doc.moveDown();


      // ========================================================
      // SYMPTOMS
      // ========================================================

      if (
        prescription.symptoms &&
        prescription.symptoms.length > 0
      ) {

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(
            "Symptoms"
          );


        prescription.symptoms.forEach(
          (symptom) => {

            doc
              .font("Helvetica")
              .fontSize(11)
              .text(
                `- ${symptom}`
              );

          }
        );


        doc.moveDown();

      }


      // ========================================================
      // MEDICINES
      // ========================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
          "Medicines"
        );


      if (
        prescription.medicines &&
        prescription.medicines.length > 0
      ) {

        prescription.medicines.forEach(
          (medicine) => {

            doc
              .font("Helvetica")
              .fontSize(11)
              .text(
                `- ${
                  medicine.medicine || ""
                }`
              );


            doc.text(
              `  Dose: ${
                medicine.dose || ""
              }`
            );


            doc.text(
              `  Duration: ${
                medicine.duration || ""
              }`
            );


            doc.text(
              `  Food: ${
                medicine.food || ""
              }`
            );


            // ==================================================
            // MEDICINE TIME
            // ==================================================

            const times = [];


            if (
              medicine.morning
            ) {

              times.push(
                "Morning"
              );

            }


            if (
              medicine.afternoon
            ) {

              times.push(
                "Afternoon"
              );

            }


            if (
              medicine.night
            ) {

              times.push(
                "Night"
              );

            }


            if (
              times.length > 0
            ) {

              doc.text(
                `  Time: ${
                  times.join(", ")
                }`
              );

            }


            // ==================================================
            // INSTRUCTION
            // ==================================================

            if (
              medicine.instruction
            ) {

              doc.text(
                `  Instruction: ${
                  medicine.instruction
                }`
              );

            }


            doc.moveDown(
              0.5
            );

          }
        );

      } else {

        doc
          .font("Helvetica")
          .fontSize(11)
          .text(
            "No medicines prescribed."
          );

      }


      doc.moveDown();


      // ========================================================
      // LAB TESTS
      // ========================================================

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
          "Lab Tests"
        );


      if (
        prescription.labTests &&
        prescription.labTests.length > 0
      ) {

        prescription.labTests.forEach(
          (test) => {

            doc
              .font("Helvetica")
              .fontSize(11)
              .text(
                `- ${
                  test.testName || ""
                }`
              );


            doc.text(
              `  Priority: ${
                test.priority ||
                "Normal"
              }`
            );


            if (test.note) {

              doc.text(
                `  Note: ${
                  test.note
                }`
              );

            }


            doc.moveDown(
              0.5
            );

          }
        );

      } else {

        doc
          .font("Helvetica")
          .fontSize(11)
          .text(
            "No lab tests prescribed."
          );

      }


      doc.moveDown();


      // ========================================================
      // ADVICE
      // ========================================================

      if (
        prescription.advice
      ) {

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(
            "Advice"
          );


        doc
          .font("Helvetica")
          .fontSize(11)
          .text(
            prescription.advice
          );

      }


      // ========================================================
      // HEALTHHOME ADVERTISEMENT
      // ========================================================

      addHealthHomeAdvertisement(
        doc
      );


      // ========================================================
      // HEALTHHOME FOOTER
      // ========================================================

      addHealthHomeFooter(
        doc
      );


      // ========================================================
      // FINISH PDF
      // ========================================================

      doc.end();


    } catch (e) {

      console.error(
        "PDF ERROR:",
        e
      );


      if (!res.headersSent) {

        res.status(500).json({

          success: false,

          message: e.message,

        });

      }

    }

  };


// ============================================================
// SEND PRESCRIPTION
// ============================================================

const sendPrescription =
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const prescription =
        await Prescription.findById(
          id
        );


      if (!prescription) {

        return res.status(404).json({

          success: false,

          message:
            "Prescription not found",

        });

      }


      prescription.status =
        "SENT";


      await prescription.save();


      if (
        prescription.appointmentId
      ) {

        await Appointment.findByIdAndUpdate(
          prescription.appointmentId,
          {
            prescriptionSent:
              true,
          }
        );

      }


      res.json({

        success: true,

        message:
          "Prescription sent successfully",

        prescription,

      });


    } catch (e) {

      console.error(
        "SEND PRESCRIPTION ERROR:",
        e
      );


      res.status(500).json({

        success: false,

        message: e.message,

      });

    }

  };


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  savePrescription,

  getPatientPrescriptions,

  downloadPrescription,

  sendPrescription,

};


console.log(
  "✅ Prescription controller exports:",
  {

    savePrescription:
      typeof savePrescription,

    getPatientPrescriptions:
      typeof getPatientPrescriptions,

    downloadPrescription:
      typeof downloadPrescription,

    sendPrescription:
      typeof sendPrescription,

  }
);