const Order = require("../models/orderModel");
const Medicine = require("../models/medicine");
const Pharmacy = require("../models/pharmacy");

// ============================================================
// HELPER: NORMALIZE PAYMENT METHOD
// ============================================================

const normalizePaymentMethod = (paymentMethod) => {
  if (
    paymentMethod === "ONLINE" ||
    paymentMethod === "COD"
  ) {
    return paymentMethod;
  }

  if (paymentMethod === "Cash on Delivery") {
    return "COD";
  }

  return "COD";
};

// ============================================================
// HELPER: REPAIR / RECALCULATE ORDER AMOUNTS
// ============================================================

const repairOrderAmounts = async (order) => {
  try {
    // ========================================================
    // PRESCRIPTION ORDER WITHOUT MEDICINES
    // ========================================================

    if (
      order.orderType === "PRESCRIPTION" &&
      (!Array.isArray(order.medicines) ||
        order.medicines.length === 0)
    ) {
      order.medicines = [];

      order.subtotal = 0;

      order.deliveryFee =
        Number(order.deliveryFee) || 0;

      order.discount =
        Number(order.discount) || 0;

      order.totalAmount = Math.max(
        0,
        order.deliveryFee -
          order.discount
      );

      order.platformFee =
        Number(order.platformFee) || 0;

      order.providerAmount = Math.max(
        0,
        order.totalAmount -
          order.platformFee
      );

      return {
        success: true,
        subtotal: 0,
        totalAmount: order.totalAmount,
      };
    }

    // ========================================================
    // LEGACY PRESCRIPTION ORDER DETECTION
    // ========================================================

    if (
      (!order.orderType ||
        order.orderType === "MEDICINE") &&
      Array.isArray(order.medicines) &&
      order.medicines.length === 1 &&
      (
        !order.medicines[0].medicineId ||
        order.medicines[0].medicineName ===
          "Prescription Order"
      ) &&
      order.prescriptionImage
    ) {
      order.orderType =
        "PRESCRIPTION";

      order.medicines = [];

      order.subtotal = 0;

      order.deliveryFee =
        Number(order.deliveryFee) || 0;

      order.discount =
        Number(order.discount) || 0;

      order.totalAmount = Math.max(
        0,
        order.deliveryFee -
          order.discount
      );

      order.platformFee =
        Number(order.platformFee) || 0;

      order.providerAmount = Math.max(
        0,
        order.totalAmount -
          order.platformFee
      );

      return {
        success: true,
        subtotal: 0,
        totalAmount: order.totalAmount,
      };
    }

    // ========================================================
    // MEDICINE ORDER VALIDATION
    // ========================================================

    if (
      !Array.isArray(order.medicines) ||
      order.medicines.length === 0
    ) {
      return {
        success: false,
        message:
          "Order does not contain any medicines.",
      };
    }

    let calculatedSubtotal = 0;

    // ========================================================
    // REPAIR EACH MEDICINE
    // ========================================================

    for (const item of order.medicines) {
      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return {
          success: false,
          message:
            `Invalid quantity for medicine ${
              item.medicineName ||
              item.medicineId ||
              ""
            }.`,
        };
      }

      // ------------------------------------------------------
      // PRICE
      // ------------------------------------------------------

      let price =
        Number(item.price);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        if (!item.medicineId) {
          return {
            success: false,
            message:
              `Price is missing for medicine ${
                item.medicineName || ""
              }.`,
          };
        }

        let medicine = null;

        try {
          medicine =
            await Medicine.findById(
              item.medicineId
            );
        } catch (error) {
          return {
            success: false,
            message:
              "Invalid medicine ID while repairing order.",
          };
        }

        if (!medicine) {
          return {
            success: false,
            message:
              `Medicine not found: ${item.medicineId}`,
          };
        }

        price =
          Number(medicine.price);

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          return {
            success: false,
            message:
              `Invalid price for ${
                medicine.medicineName ||
                item.medicineId
              }.`,
          };
        }

        item.price = price;
      }

      // ------------------------------------------------------
      // SUBTOTAL
      // ------------------------------------------------------

      const itemSubtotal =
        price * quantity;

      if (
        !Number.isFinite(itemSubtotal) ||
        itemSubtotal < 0
      ) {
        return {
          success: false,
          message:
            `Unable to calculate subtotal for ${
              item.medicineName ||
              item.medicineId ||
              ""
            }.`,
        };
      }

      item.subtotal =
        itemSubtotal;

      calculatedSubtotal +=
        itemSubtotal;
    }

    // ========================================================
    // ORDER SUBTOTAL
    // ========================================================

    if (
      !Number.isFinite(
        calculatedSubtotal
      )
    ) {
      return {
        success: false,
        message:
          "Invalid calculated order subtotal.",
      };
    }

    // ========================================================
    // DELIVERY FEE
    // ========================================================

    const deliveryFee =
      Number(order.deliveryFee) || 0;

    // ========================================================
    // DISCOUNT
    // ========================================================

    const discount =
      Number(order.discount) || 0;

    // ========================================================
    // TOTAL
    // ========================================================

    const totalAmount =
      calculatedSubtotal +
      deliveryFee -
      discount;

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount < 0
    ) {
      return {
        success: false,
        message:
          "Invalid calculated order total.",
      };
    }

    // ========================================================
    // PLATFORM FEE
    // ========================================================

    const platformFee =
      Number(order.platformFee) || 0;

    const providerAmount =
      Math.max(
        0,
        totalAmount -
          platformFee
      );

    // ========================================================
    // UPDATE ORDER
    // ========================================================

    order.subtotal =
      calculatedSubtotal;

    order.deliveryFee =
      deliveryFee;

    order.discount =
      discount;

    order.totalAmount =
      totalAmount;

    order.platformFee =
      platformFee;

    order.providerAmount =
      providerAmount;

    return {
      success: true,
      subtotal:
        calculatedSubtotal,
      totalAmount,
    };
  } catch (error) {
    console.error(
      "REPAIR ORDER AMOUNTS ERROR:",
      error
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to repair order amounts.",
    };
  }
};

// ============================================================
// HELPER: FIND PHARMACY
// ============================================================

const findPharmacy = async ({
  pharmacyId,
  pharmacyPhone,
}) => {
  let pharmacy = null;

  if (pharmacyId) {
    try {
      pharmacy =
        await Pharmacy.findById(
          pharmacyId
        );
    } catch (error) {
      return null;
    }
  }

  if (
    !pharmacy &&
    pharmacyPhone
  ) {
    pharmacy =
      await Pharmacy.findOne({
        phone: pharmacyPhone,
      });
  }

  return pharmacy;
};

// ============================================================
// PLACE NORMAL MEDICINE ORDER
// ============================================================

const placeOrder = async (
  req,
  res
) => {
  try {
    console.log("");
    console.log(
      "=================================================="
    );
    console.log(
      "========== NEW MEDICINE ORDER ===================="
    );
    console.log(
      "=================================================="
    );

    console.log(
      "REQUEST BODY =",
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

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
    // VALIDATION
    // ========================================================

    if (
      !patientName ||
      !patientPhone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Patient name and phone are required.",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery address is required.",
      });
    }

    if (
      !Array.isArray(medicines) ||
      medicines.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one medicine is required.",
      });
    }

    // ========================================================
    // PHARMACY
    // ========================================================

    const pharmacy =
      await findPharmacy({
        pharmacyId,
        pharmacyPhone,
      });

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message:
          "Pharmacy not found.",
      });
    }

    if (
      pharmacy.available ===
      false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This pharmacy is currently unavailable.",
      });
    }

    // ========================================================
    // PAYMENT
    // ========================================================

    const finalPaymentMethod =
      normalizePaymentMethod(
        paymentMethod
      );

    // ========================================================
    // VERIFY MEDICINES
    // ========================================================

    const verifiedMedicines = [];

    let subtotal = 0;

    for (
      const item of medicines
    ) {
      const medicineId =
        item.medicineId;

      const quantity =
        Number(
          item.quantity
        );

      if (
        !medicineId ||
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid medicine ID or quantity.",
        });
      }

      let medicine = null;

      try {
        medicine =
          await Medicine.findById(
            medicineId
          );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid medicine ID: ${medicineId}`,
        });
      }

      if (!medicine) {
        return res.status(404).json({
          success: false,
          message:
            `Medicine not found: ${medicineId}`,
        });
      }

      // ------------------------------------------------------
      // CHECK PHARMACY
      // ------------------------------------------------------

      if (
        pharmacy.phone &&
        medicine.pharmacyPhone &&
        String(
          medicine.pharmacyPhone
        ).trim() !==
          String(
            pharmacy.phone
          ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${medicine.medicineName} does not belong to the selected pharmacy.`,
        });
      }

      // ------------------------------------------------------
      // STOCK
      // ------------------------------------------------------

      const stock =
        Number(
          medicine.stock
        );

      if (
        !Number.isFinite(stock) ||
        stock < quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${medicine.medicineName} has only ${medicine.stock} item(s) available.`,
        });
      }

      // ------------------------------------------------------
      // DATABASE PRICE
      // ------------------------------------------------------

      const actualPrice =
        Number(
          medicine.price
        );

      if (
        !Number.isFinite(
          actualPrice
        ) ||
        actualPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid price for ${medicine.medicineName}.`,
        });
      }

      const itemSubtotal =
        actualPrice *
        quantity;

      subtotal +=
        itemSubtotal;

      verifiedMedicines.push({
        medicineId:
          String(
            medicine._id
          ),

        medicineName:
          medicine.medicineName,

        quantity,

        price:
          actualPrice,

        subtotal:
          itemSubtotal,
      });
    }

    // ========================================================
    // FINAL TOTAL
    // ========================================================

    const deliveryFee = 0;
    const discount = 0;

    const totalAmount =
      subtotal +
      deliveryFee -
      discount;

    const platformFee = 0;

    const providerAmount =
      Math.max(
        0,
        totalAmount -
          platformFee
      );

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const order =
      await Order.create({
        patientId:
          patientId || "",

        patientName:
          String(
            patientName
          ).trim(),

        patientPhone:
          String(
            patientPhone
          ).trim(),

        pharmacyId:
          String(
            pharmacy._id
          ),

        pharmacyName:
          pharmacy.name ||
          pharmacyName ||
          "",

        pharmacyPhone:
          pharmacy.phone ||
          pharmacyPhone ||
          "",

        orderType:
          "MEDICINE",

        address:
          String(
            address
          ).trim(),

        notes:
          notes || "",

        prescriptionImage:
          prescriptionImage ||
          "",

        medicines:
          verifiedMedicines,

        subtotal,

        deliveryFee,

        discount,

        totalAmount,

        currency:
          "INR",

        paymentMethod:
          finalPaymentMethod,

        paymentStatus:
          "Pending",

        settlementStatus:
          "Pending",

        platformFee,

        providerAmount,

        cashCollected:
          false,

        cashCollectedAt:
          null,

        deliveryAgentName:
          "",

        deliveryAgentPhone:
          "",

        deliveryAgentAssigned:
          false,

        deliveryAgentAssignedAt:
          null,

        acceptedAt:
          null,

        status:
          "Pending",
      });

    console.log(
      "MEDICINE ORDER CREATED:",
      order._id
    );

    console.log(
      "TOTAL =",
      order.totalAmount
    );

    return res.status(201).json({
      success: true,

      message:
        "Medicine order placed successfully.",

      order: {
        id:
          order._id,

        orderType:
          order.orderType,

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
          Number(
            order.subtotal
          ),

        deliveryFee:
          Number(
            order.deliveryFee
          ),

        discount:
          Number(
            order.discount
          ),

        totalAmount:
          Number(
            order.totalAmount
          ),

        currency:
          order.currency,

        paymentMethod:
          order.paymentMethod,

        paymentStatus:
          order.paymentStatus,

        status:
          order.status,

        acceptedAt:
          order.acceptedAt,

        createdAt:
          order.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "PLACE MEDICINE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to place medicine order.",
    });
  }
};

// ============================================================
// PLACE PRESCRIPTION IMAGE ORDER
// ============================================================

const placePrescriptionOrder =
  async (
    req,
    res
  ) => {
    try {
      console.log("");
      console.log(
        "=================================================="
      );
      console.log(
        "======= NEW PRESCRIPTION ORDER ==================="
      );
      console.log(
        "=================================================="
      );

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
      } = req.body;

      // ======================================================
      // VALIDATION
      // ======================================================

      if (
        !patientName ||
        !patientPhone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Patient name and phone are required.",
        });
      }

      if (!address) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address is required.",
        });
      }

      if (
        !prescriptionImage ||
        !String(
          prescriptionImage
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Prescription image is required.",
        });
      }

      // ======================================================
      // PHARMACY
      // ======================================================

      const pharmacy =
        await findPharmacy({
          pharmacyId,
          pharmacyPhone,
        });

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message:
            "Pharmacy not found.",
        });
      }

      if (
        pharmacy.available ===
        false
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This pharmacy is currently unavailable.",
        });
      }

      // ======================================================
      // CREATE PRESCRIPTION ORDER
      // ======================================================

      const order =
        await Order.create({
          patientId:
            patientId || "",

          patientName:
            String(
              patientName
            ).trim(),

          patientPhone:
            String(
              patientPhone
            ).trim(),

          pharmacyId:
            String(
              pharmacy._id
            ),

          pharmacyName:
            pharmacy.name ||
            pharmacyName ||
            "",

          pharmacyPhone:
            pharmacy.phone ||
            pharmacyPhone ||
            "",

          orderType:
            "PRESCRIPTION",

          address:
            String(
              address
            ).trim(),

          notes:
            notes || "",

          prescriptionImage:
            String(
              prescriptionImage
            ).trim(),

          medicines: [],

          subtotal: 0,

          deliveryFee: 0,

          discount: 0,

          totalAmount: 0,

          currency:
            "INR",

          paymentMethod:
            "COD",

          paymentStatus:
            "Pending",

          settlementStatus:
            "Pending",

          platformFee: 0,

          providerAmount: 0,

          cashCollected:
            false,

          cashCollectedAt:
            null,

          deliveryAgentName:
            "",

          deliveryAgentPhone:
            "",

          deliveryAgentAssigned:
            false,

          deliveryAgentAssignedAt:
            null,

          acceptedAt:
            null,

          status:
            "Pending",
        });

      console.log(
        "PRESCRIPTION ORDER CREATED:",
        order._id
      );

      return res.status(201).json({
        success: true,

        message:
          "Prescription order placed successfully.",

        order: {
          id:
            order._id,

          orderType:
            order.orderType,

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

          subtotal: 0,

          deliveryFee: 0,

          discount: 0,

          totalAmount: 0,

          paymentMethod:
            "COD",

          paymentStatus:
            "Pending",

          status:
            "Pending",

          acceptedAt:
            null,

          createdAt:
            order.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "PLACE PRESCRIPTION ORDER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to place prescription order.",
      });
    }
  };

// ============================================================
// CONFIRM PRESCRIPTION ORDER
// ============================================================

const confirmPrescriptionOrder =
  async (
    req,
    res
  ) => {
    try {
      const {
        medicines,
        deliveryFee = 0,
        discount = 0,
      } = req.body;

      // ======================================================
      // FIND ORDER
      // ======================================================

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

      // ======================================================
      // ORDER TYPE
      // ======================================================

      if (
        order.orderType !==
        "PRESCRIPTION"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This is not a prescription order.",
        });
      }

      // ======================================================
      // STATUS
      // ======================================================

      if (
        order.status !==
          "Pending" &&
        order.status !==
          "Accepted"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Prescription can only be confirmed while the order is Pending or Accepted.",
        });
      }

      // ======================================================
      // MEDICINES
      // ======================================================

      if (
        !Array.isArray(
          medicines
        ) ||
        medicines.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one medicine is required.",
        });
      }

      const verifiedMedicines =
        [];

      let subtotal = 0;

      // ======================================================
      // VERIFY MEDICINES
      // ======================================================

      for (
        const item of medicines
      ) {
        const medicineId =
          item.medicineId;

        const quantity =
          Number(
            item.quantity
          );

        if (
          !medicineId ||
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid medicine ID or quantity.",
          });
        }

        let medicine = null;

        try {
          medicine =
            await Medicine.findById(
              medicineId
            );
        } catch (error) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid medicine ID: ${medicineId}`,
          });
        }

        if (!medicine) {
          return res.status(404).json({
            success: false,
            message:
              `Medicine not found: ${medicineId}`,
          });
        }

        // ----------------------------------------------------
        // CHECK PHARMACY
        // ----------------------------------------------------

        if (
          order.pharmacyPhone &&
          medicine.pharmacyPhone &&
          String(
            medicine.pharmacyPhone
          ).trim() !==
            String(
              order.pharmacyPhone
            ).trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${medicine.medicineName} does not belong to this pharmacy.`,
          });
        }

        // ----------------------------------------------------
        // STOCK
        // ----------------------------------------------------

        const stock =
          Number(
            medicine.stock
          );

        if (
          !Number.isFinite(stock) ||
          stock < quantity
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${medicine.medicineName} has only ${medicine.stock} item(s) available.`,
          });
        }

        // ----------------------------------------------------
        // DATABASE PRICE
        // ----------------------------------------------------

        const price =
          Number(
            medicine.price
          );

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid price for ${medicine.medicineName}.`,
          });
        }

        const itemSubtotal =
          price * quantity;

        subtotal +=
          itemSubtotal;

        verifiedMedicines.push({
          medicineId:
            String(
              medicine._id
            ),

          medicineName:
            medicine.medicineName,

          quantity,

          price,

          subtotal:
            itemSubtotal,
        });
      }

      // ======================================================
      // FEES
      // ======================================================

      const finalDeliveryFee =
        Number(
          deliveryFee
        ) || 0;

      const finalDiscount =
        Number(
          discount
        ) || 0;

      if (
        finalDeliveryFee < 0 ||
        finalDiscount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery fee or discount.",
        });
      }

      // ======================================================
      // TOTAL
      // ======================================================

      const totalAmount =
        subtotal +
        finalDeliveryFee -
        finalDiscount;

      if (
        !Number.isFinite(
          totalAmount
        ) ||
        totalAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid calculated total.",
        });
      }

      // ======================================================
      // PLATFORM FEE
      // ======================================================

      const platformFee =
        Number(
          order.platformFee
        ) || 0;

      const providerAmount =
        Math.max(
          0,
          totalAmount -
            platformFee
        );

      // ======================================================
      // UPDATE ORDER
      // ======================================================

      order.medicines =
        verifiedMedicines;

      order.subtotal =
        subtotal;

      order.deliveryFee =
        finalDeliveryFee;

      order.discount =
        finalDiscount;

      order.totalAmount =
        totalAmount;

      order.providerAmount =
        providerAmount;

      // ======================================================
      // ACCEPT ORDER
      // ======================================================

      order.status =
        "Accepted";

      // IMPORTANT:
      // Save exact acceptance time.
      // Pharmacy Dashboard uses acceptedAt
      // to show newest accepted orders first.

      if (!order.acceptedAt) {
        order.acceptedAt =
          new Date();
      }

      await order.save();

      console.log(
        "PRESCRIPTION ORDER CONFIRMED"
      );

      console.log(
        "ORDER ID =",
        order._id
      );

      console.log(
        "TOTAL =",
        order.totalAmount
      );

      console.log(
        "ACCEPTED AT =",
        order.acceptedAt
      );

      return res.status(200).json({
        success: true,

        message:
          "Prescription order confirmed successfully.",

        order,
      });
    } catch (error) {
      console.error(
        "CONFIRM PRESCRIPTION ORDER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to confirm prescription order.",
      });
    }
  };

// ============================================================
// GET PHARMACY ORDERS
// ============================================================

const getPharmacyOrders =
  async (
    req,
    res
  ) => {
    try {
      const pharmacyId =
        req.params.pharmacyId;

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
// GET PATIENT ORDERS
// ============================================================

const getPatientOrders =
  async (
    req,
    res
  ) => {
    try {
      const phone =
        req.params.phone;

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

const updateOrderStatus =
  async (
    req,
    res
  ) => {
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
        !allowedStatuses.includes(
          status
        )
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

      // ======================================================
      // UNCONFIRMED PRESCRIPTION
      // ======================================================

      if (
        order.orderType ===
          "PRESCRIPTION" &&
        (!order.medicines ||
          order.medicines.length === 0)
      ) {
        // Pending is allowed.

        // Accepted must happen through
        // confirmPrescriptionOrder().

        if (
          status ===
          "Accepted"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Please confirm the prescription medicines and amount before accepting this order.",
          });
        }

        if (
          status === "Packed" ||
          status ===
            "Out for Delivery" ||
          status === "Delivered"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Prescription order must be confirmed before continuing delivery.",
          });
        }

        order.status =
          status;

        if (
          status ===
          "Cancelled"
        ) {
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
      }

      // ======================================================
      // NORMAL MEDICINE ORDER
      // ======================================================

      const repairResult =
        await repairOrderAmounts(
          order
        );

      if (
        !repairResult.success
      ) {
        return res.status(400).json({
          success: false,
          message:
            repairResult.message,
        });
      }

      // ======================================================
      // DELIVERY PARTNER
      // ======================================================

      if (
        status ===
          "Out for Delivery" &&
        !order.deliveryAgentAssigned
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery partner must be assigned before the order goes Out for Delivery.",
        });
      }

      // ======================================================
      // STATUS
      // ======================================================

      order.status =
        status;

      // ======================================================
      // ACCEPTED TIME
      // ======================================================

      if (
        status === "Accepted" &&
        !order.acceptedAt
      ) {
        order.acceptedAt =
          new Date();
      }

      // ======================================================
      // CANCELLATION
      // ======================================================

      if (
        status ===
        "Cancelled"
      ) {
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
          error.message ||
          "Unable to update order status.",
      });
    }
  };

// ============================================================
// ASSIGN DELIVERY PARTNER
// ============================================================

const assignDeliveryAgent =
  async (
    req,
    res
  ) => {
    try {
      const {
        deliveryAgentName,
        deliveryAgentPhone,
      } = req.body;

      if (
        !deliveryAgentName ||
        !String(
          deliveryAgentName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery partner name is required.",
        });
      }

      if (
        !deliveryAgentPhone ||
        !String(
          deliveryAgentPhone
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery partner phone is required.",
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

      if (
        order.status !==
          "Accepted" &&
        order.status !==
          "Packed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery partner can only be assigned after the order is accepted.",
        });
      }

      // ======================================================
      // PRESCRIPTION ORDER
      // ======================================================

      if (
        order.orderType ===
          "PRESCRIPTION" &&
        (
          !order.medicines ||
          order.medicines.length === 0 ||
          Number(
            order.totalAmount
          ) <= 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Prescription order must be confirmed with medicines and final amount first.",
        });
      }

      // ======================================================
      // REPAIR ORDER AMOUNT
      // ======================================================

      const repairResult =
        await repairOrderAmounts(
          order
        );

      if (
        !repairResult.success
      ) {
        return res.status(400).json({
          success: false,
          message:
            repairResult.message,
        });
      }

      // ======================================================
      // ASSIGN
      // ======================================================

      order.deliveryAgentName =
        String(
          deliveryAgentName
        ).trim();

      order.deliveryAgentPhone =
        String(
          deliveryAgentPhone
        ).trim();

      order.deliveryAgentAssigned =
        true;

      order.deliveryAgentAssignedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        success: true,

        message:
          "Delivery partner assigned successfully.",

        order,
      });
    } catch (error) {
      console.error(
        "ASSIGN DELIVERY PARTNER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to assign delivery partner.",
      });
    }
  };

// ============================================================
// REMOVE DELIVERY PARTNER
// ============================================================

const removeDeliveryAgent =
  async (
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

      if (
        order.status ===
        "Delivered"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery partner cannot be removed after the order is delivered.",
        });
      }

      order.deliveryAgentName =
        "";

      order.deliveryAgentPhone =
        "";

      order.deliveryAgentAssigned =
        false;

      order.deliveryAgentAssignedAt =
        null;

      await order.save();

      return res.status(200).json({
        success: true,

        message:
          "Delivery partner removed successfully.",

        order,
      });
    } catch (error) {
      console.error(
        "REMOVE DELIVERY PARTNER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to remove delivery partner.",
      });
    }
  };

// ============================================================
// COLLECT COD PAYMENT
// ============================================================

const collectCODPayment =
  async (
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

      // ======================================================
      // PAYMENT METHOD
      // ======================================================

      if (
        order.paymentMethod !==
          "COD" &&
        order.paymentMethod !==
          "Cash on Delivery"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order is not a COD order.",
        });
      }

      // ======================================================
      // ALREADY COLLECTED
      // ======================================================

      if (
        order.cashCollected ||
        order.paymentStatus ===
          "Collected"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "COD payment has already been collected.",
        });
      }

      // ======================================================
      // DELIVERY STATUS
      // ======================================================

      if (
        order.status !==
          "Out for Delivery" &&
        order.status !==
          "Delivered"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "COD payment can only be collected during delivery.",
        });
      }

      // ======================================================
      // PRESCRIPTION FINAL AMOUNT
      // ======================================================

      if (
        order.orderType ===
          "PRESCRIPTION" &&
        (
          !order.medicines ||
          order.medicines.length === 0 ||
          Number(
            order.totalAmount
          ) <= 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Prescription order has not been confirmed with a final amount.",
        });
      }

      // ======================================================
      // REPAIR NORMAL MEDICINE ORDER
      // ======================================================

      if (
        order.orderType !==
        "PRESCRIPTION"
      ) {
        const repairResult =
          await repairOrderAmounts(
            order
          );

        if (
          !repairResult.success
        ) {
          return res.status(400).json({
            success: false,
            message:
              repairResult.message,
          });
        }
      }

      // ======================================================
      // COLLECT
      // ======================================================

      order.paymentStatus =
        "Collected";

      order.cashCollected =
        true;

      order.cashCollectedAt =
        new Date();

      order.settlementStatus =
        "Pending";

      await order.save();

      console.log(
        "COD PAYMENT COLLECTED"
      );

      console.log(
        "ORDER ID =",
        order._id
      );

      console.log(
        "AMOUNT =",
        order.totalAmount
      );

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
          error.message ||
          "Unable to collect COD payment.",
      });
    }
  };

// ============================================================
// GET ALL ORDERS
// ============================================================

const getAllOrders =
  async (
    req,
    res
  ) => {
    try {
      const orders =
        await Order.find()
          .sort({
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

  placePrescriptionOrder,

  confirmPrescriptionOrder,

  getPharmacyOrders,

  getPatientOrders,

  updateOrderStatus,

  assignDeliveryAgent,

  removeDeliveryAgent,

  collectCODPayment,

  getAllOrders,
};