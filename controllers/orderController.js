const Order = require("../models/orderModel");
const Medicine = require("../models/medicine");
const Pharmacy = require("../models/pharmacy");

// ============================================================
// PLACE MEDICINE ORDER
// ============================================================

const placeOrder = async (req, res) => {
  try {
    console.log("");
    console.log("==================================================");
    console.log("========== NEW MEDICINE ORDER ====================");
    console.log("==================================================");
    console.log("REQUEST BODY =", JSON.stringify(req.body, null, 2));

    const {
      patientId,
      patientName,
      patientPhone,

      pharmacyId,
      pharmacyName,
      pharmacyPhone,

      address,
      notes,
      prescriptionImage,

      medicines,

      paymentMethod,
    } = req.body;

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!patientName || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: "Patient name and phone are required.",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required.",
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one medicine is required.",
      });
    }

    // ========================================================
    // PAYMENT METHOD
    // ========================================================

    let finalPaymentMethod = "COD";

    if (paymentMethod === "ONLINE" || paymentMethod === "COD") {
      finalPaymentMethod = paymentMethod;
    }

    console.log("PAYMENT METHOD =", finalPaymentMethod);

    // ========================================================
    // PHARMACY VALIDATION
    // ========================================================

    let pharmacy = null;

    if (pharmacyId) {
      try {
        pharmacy = await Pharmacy.findById(pharmacyId);
      } catch (error) {
        console.log("INVALID PHARMACY ID =", pharmacyId);

        return res.status(400).json({
          success: false,
          message: "Invalid pharmacy ID.",
        });
      }
    }

    // If pharmacyId is not available, try pharmacy phone
    if (!pharmacy && pharmacyPhone) {
      pharmacy = await Pharmacy.findOne({
        phone: pharmacyPhone,
      });
    }

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found.",
      });
    }

    console.log("SELECTED PHARMACY ID =", pharmacy._id);
    console.log("SELECTED PHARMACY NAME =", pharmacy.name);
    console.log("SELECTED PHARMACY PHONE =", pharmacy.phone);

    if (pharmacy.available === false) {
      return res.status(400).json({
        success: false,
        message: "This pharmacy is currently unavailable.",
      });
    }

    // ========================================================
    // VERIFY MEDICINES
    // ========================================================

    const verifiedMedicines = [];

    let subtotal = 0;

    console.log("");
    console.log("==================================================");
    console.log("========== VERIFYING MEDICINES ===================");
    console.log("==================================================");

    for (const item of medicines) {
      const medicineId = item.medicineId;

      const quantity = Number(item.quantity);

      console.log("");
      console.log("REQUESTED MEDICINE");
      console.log("Medicine ID =", medicineId);
      console.log("Quantity =", quantity);

      // ------------------------------------------------------
      // Validate quantity
      // ------------------------------------------------------

      if (
        !medicineId ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid medicine ID or quantity.",
        });
      }

      // ------------------------------------------------------
      // Find actual medicine
      // ------------------------------------------------------

      let medicine = null;

      try {
        medicine = await Medicine.findById(medicineId);
      } catch (error) {
        console.log("INVALID MEDICINE ID =", medicineId);

        return res.status(400).json({
          success: false,
          message: `Invalid medicine ID: ${medicineId}`,
        });
      }

      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found: ${medicineId}`,
        });
      }

      console.log("FOUND MEDICINE =", medicine.medicineName);
      console.log("MONGO MEDICINE ID =", medicine._id);
      console.log("MEDICINE PHARMACY PHONE =", medicine.pharmacyPhone);
      console.log("MEDICINE PRICE =", medicine.price);
      console.log("MEDICINE STOCK =", medicine.stock);

      // ------------------------------------------------------
      // Verify medicine belongs to selected pharmacy
      // ------------------------------------------------------
      //
      // Medicine model currently stores pharmacyPhone.
      // Therefore selected pharmacy's phone must match.
      //

      if (
        pharmacy.phone &&
        medicine.pharmacyPhone &&
        String(medicine.pharmacyPhone).trim() !==
          String(pharmacy.phone).trim()
      ) {
        console.log("PHARMACY OWNERSHIP CHECK FAILED");

        return res.status(400).json({
          success: false,
          message:
            `${medicine.medicineName} does not belong to the selected pharmacy.`,
        });
      }

      // If medicine has no pharmacy phone, reject it.
      if (!medicine.pharmacyPhone) {
        return res.status(400).json({
          success: false,
          message:
            `${medicine.medicineName} is not linked to a pharmacy.`,
        });
      }

      // ------------------------------------------------------
      // Check stock
      // ------------------------------------------------------

      const availableStock = Number(medicine.stock);

      if (
        !Number.isFinite(availableStock) ||
        availableStock < quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${medicine.medicineName} has only ${medicine.stock} item(s) available.`,
        });
      }

      // ------------------------------------------------------
      // Read PRICE from MongoDB
      // NEVER TRUST FLUTTER PRICE
      // ------------------------------------------------------

      const actualPrice = Number(medicine.price);

      if (
        !Number.isFinite(actualPrice) ||
        actualPrice <= 0
      ) {
        console.log(
          "INVALID MEDICINE PRICE =",
          medicine.price
        );

        return res.status(400).json({
          success: false,
          message:
            `Invalid price for ${medicine.medicineName}.`,
        });
      }

      // ------------------------------------------------------
      // Calculate item subtotal
      // ------------------------------------------------------

      const itemSubtotal =
        actualPrice * quantity;

      if (
        !Number.isFinite(itemSubtotal) ||
        itemSubtotal <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Unable to calculate price for ${medicine.medicineName}.`,
        });
      }

      // Add item subtotal to order subtotal
      subtotal += itemSubtotal;

      // ------------------------------------------------------
      // IMPORTANT DEBUG LOG
      // ------------------------------------------------------

      console.log("");
      console.log("========== MEDICINE PRICE CALCULATION ==========");
      console.log("Medicine Name =", medicine.medicineName);
      console.log("Medicine ID =", medicine._id);
      console.log("Actual Price =", actualPrice);
      console.log("Quantity =", quantity);
      console.log("Item Subtotal =", itemSubtotal);
      console.log("Current Subtotal =", subtotal);
      console.log("===============================================");

      // ------------------------------------------------------
      // Save verified medicine snapshot
      // ------------------------------------------------------

      verifiedMedicines.push({
        medicineId: String(medicine._id),

        medicineName:
          medicine.medicineName,

        quantity,

        price: actualPrice,

        subtotal: itemSubtotal,
      });
    }

    // ========================================================
    // VALIDATE SUBTOTAL
    // ========================================================

    if (
      !Number.isFinite(subtotal) ||
      subtotal <= 0
    ) {
      console.log(
        "INVALID SUBTOTAL =",
        subtotal
      );

      return res.status(400).json({
        success: false,
        message: "Invalid order subtotal.",
      });
    }

    console.log("");
    console.log("==================================================");
    console.log("VERIFIED SUBTOTAL =", subtotal);
    console.log("==================================================");

    // ========================================================
    // DELIVERY FEE
    // ========================================================

    // Currently free delivery.
    // Can be changed later to dynamic delivery pricing.

    const deliveryFee = 0;

    // ========================================================
    // DISCOUNT
    // ========================================================

    const discount = 0;

    // ========================================================
    // FINAL TOTAL
    // ========================================================

    const totalAmount =
      subtotal +
      deliveryFee -
      discount;

    // IMPORTANT DEBUG LOG
    console.log("");
    console.log("==================================================");
    console.log("========== FINAL ORDER TOTAL =====================");
    console.log("==================================================");
    console.log("Subtotal =", subtotal);
    console.log("Delivery Fee =", deliveryFee);
    console.log("Discount =", discount);
    console.log("FINAL TOTAL =", totalAmount);
    console.log("==================================================");

    // ========================================================
    // FINAL TOTAL VALIDATION
    // ========================================================

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      console.log(
        "❌ INVALID FINAL TOTAL =",
        totalAmount
      );

      return res.status(400).json({
        success: false,
        message: "Invalid order total.",
      });
    }

    // ========================================================
    // PLATFORM COMMISSION
    // ========================================================

    // Currently configured as 0%.
    //
    // Later you can change this according to
    // your HealthHome business model.

    const platformFee = 0;

    const providerAmount =
      totalAmount - platformFee;

    console.log("");
    console.log("PLATFORM FEE =", platformFee);
    console.log("PHARMACY AMOUNT =", providerAmount);

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const order = await Order.create({
      patientId: patientId || "",

      patientName:
        String(patientName).trim(),

      patientPhone:
        String(patientPhone).trim(),

      pharmacyId:
        String(pharmacy._id),

      pharmacyName:
        pharmacy.name ||
        pharmacyName ||
        "",

      pharmacyPhone:
        pharmacy.phone ||
        pharmacyPhone ||
        "",

      address:
        String(address).trim(),

      notes:
        notes || "",

      prescriptionImage:
        prescriptionImage || "",

      medicines:
        verifiedMedicines,

      // IMPORTANT:
      // Store calculated values from backend.
      subtotal,

      deliveryFee,

      discount,

      totalAmount,

      currency: "INR",

      paymentMethod:
        finalPaymentMethod,

      // Payment becomes Paid only
      // after Razorpay verification.
      paymentStatus:
        "Pending",

      // Razorpay IDs will be added
      // by paymentController.
      razorpayOrderId: "",

      razorpayPaymentId: "",

      razorpaySignature: "",

      paymentRecordId: "",

      // Settlement
      settlementStatus:
        "Pending",

      settlementId: "",

      platformFee,

      providerAmount,

      // COD
      cashCollected: false,

      cashCollectedAt: null,

      // Order
      status: "Pending",
    });

    // ========================================================
    // ORDER CREATED
    // ========================================================

    console.log("");
    console.log("==================================================");
    console.log("========== ORDER CREATED SUCCESSFULLY ===========");
    console.log("==================================================");
    console.log("ORDER ID =", order._id);
    console.log("ORDER SUBTOTAL =", order.subtotal);
    console.log("ORDER TOTAL =", order.totalAmount);
    console.log("PAYMENT METHOD =", order.paymentMethod);
    console.log("PAYMENT STATUS =", order.paymentStatus);
    console.log("==================================================");

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "Order placed successfully.",

      order: {
        id:
          order._id,

        patientId:
          order.patientId,

        patientName:
          order.patientName,

        patientPhone:
          order.patientPhone,

        pharmacyId:
          order.pharmacyId,

        pharmacyName:
          order.pharmacyName,

        pharmacyPhone:
          order.pharmacyPhone,

        address:
          order.address,

        notes:
          order.notes,

        prescriptionImage:
          order.prescriptionImage,

        medicines:
          order.medicines,

        subtotal:
          Number(order.subtotal),

        deliveryFee:
          Number(order.deliveryFee),

        discount:
          Number(order.discount),

        totalAmount:
          Number(order.totalAmount),

        currency:
          order.currency,

        paymentMethod:
          order.paymentMethod,

        paymentStatus:
          order.paymentStatus,

        settlementStatus:
          order.settlementStatus,

        platformFee:
          Number(order.platformFee),

        providerAmount:
          Number(order.providerAmount),

        cashCollected:
          order.cashCollected,

        status:
          order.status,

        createdAt:
          order.createdAt,
      },
    });

  } catch (error) {
    console.error("");
    console.error("==================================================");
    console.error("❌ PLACE ORDER ERROR");
    console.error("==================================================");
    console.error(error);
    console.error("==================================================");

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to place order.",
    });
  }
};

// ============================================================
// PHARMACY DASHBOARD ORDERS
// ============================================================

const getPharmacyOrders = async (req, res) => {
  try {
    const pharmacyId =
      req.params.pharmacyId;

    console.log("");
    console.log("========== GET PHARMACY ORDERS ==========");
    console.log("Pharmacy ID =", pharmacyId);

    const orders =
      await Order.find({
        pharmacyId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      total:
        orders.length,

      orders,
    });

  } catch (error) {
    console.error(
      "GET PHARMACY ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ============================================================
// PATIENT ORDERS
// ============================================================

const getPatientOrders = async (req, res) => {
  try {
    const phone =
      req.params.phone;

    console.log("");
    console.log("========== GET PATIENT ORDERS ==========");
    console.log("Patient Phone =", phone);

    const orders =
      await Order.find({
        patientPhone: phone,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      total:
        orders.length,

      orders,
    });

  } catch (error) {
    console.error(
      "GET PATIENT ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ============================================================
// UPDATE ORDER STATUS
// ============================================================

const updateOrderStatus = async (req, res) => {
  try {
    const {
      status,
    } = req.body;

    const allowedStatuses = [
      "Pending",
      "Accepted",
      "Packed",
      "Out for Delivery",
      "Delivered",
      "Rejected",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    // ========================================================
    // COD DELIVERY
    // ========================================================

    // When COD order becomes Delivered,
    // we DO NOT automatically assume cash was collected.
    //
    // Cash collection must be explicitly confirmed.

    if (
      status === "Delivered" &&
      order.paymentMethod === "COD" &&
      !order.cashCollected
    ) {
      console.log(
        "COD ORDER DELIVERED - CASH COLLECTION PENDING"
      );
    }

    order.status =
      status;

    // ========================================================
    // CANCELLATION
    // ========================================================

    if (status === "Cancelled") {
      order.cancelledAt =
        new Date();

      order.cancellationReason =
        req.body.reason ||
        "";
    }

    await order.save();

    return res.status(200).json({
      success: true,

      message:
        "Order status updated successfully.",

      order,
    });

  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ============================================================
// COLLECT COD PAYMENT
// ============================================================

const collectCODPayment = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    // ========================================================
    // CHECK PAYMENT METHOD
    // ========================================================

    if (
      order.paymentMethod !== "COD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order is not a COD order.",
      });
    }

    // ========================================================
    // PREVENT DUPLICATE COLLECTION
    // ========================================================

    if (
      order.cashCollected ||
      order.paymentStatus === "Collected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "COD payment has already been collected.",
      });
    }

    // ========================================================
    // ONLY COLLECT DURING DELIVERY
    // ========================================================

    if (
      order.status !== "Out for Delivery" &&
      order.status !== "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "COD payment can only be collected during delivery.",
      });
    }

    // ========================================================
    // UPDATE PAYMENT
    // ========================================================

    order.paymentStatus =
      "Collected";

    order.cashCollected =
      true;

    order.cashCollectedAt =
      new Date();

    // ========================================================
    // COD SETTLEMENT
    // ========================================================

    // Cash has been collected physically.
    // Settlement to the pharmacy is handled
    // separately from Razorpay online settlement.

    order.settlementStatus =
      "Pending";

    await order.save();

    console.log("");
    console.log("========== COD PAYMENT COLLECTED ==========");
    console.log("Order ID =", order._id);
    console.log("Amount =", order.totalAmount);
    console.log("Pharmacy =", order.pharmacyName);
    console.log("==========================================");

    return res.status(200).json({
      success: true,

      message:
        "COD payment marked as collected.",

      order,
    });

  } catch (error) {
    console.error(
      "COLLECT COD PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ============================================================
// GET ALL ORDERS - ADMIN
// ============================================================

const getAllOrders = async (req, res) => {
  try {
    const orders =
      await Order.find().sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      total:
        orders.length,

      orders,
    });

  } catch (error) {
    console.error(
      "GET ALL ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  placeOrder,

  getPharmacyOrders,

  getPatientOrders,

  updateOrderStatus,

  collectCODPayment,

  getAllOrders,
};