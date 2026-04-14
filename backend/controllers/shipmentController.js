const Shipment = require("../models/Shipment");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");
const ShippingCompany = require("../models/ShippingCompany");
const mongoose = require("mongoose");
const { createAndEmitNotification } = require("./notificationController");

const isPlatformAdmin = (user) => ["admin", "super-admin"].includes(user.role);

const normalizeLocationValue = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^ال/, "")
    .replace(/أ|إ|آ/g, "ا");
};

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private
exports.createShipment = async (req, res) => {
  try {
    const selectedCompanyId = req.body?.shippingCompany?.id;
    if (
      !selectedCompanyId ||
      !mongoose.Types.ObjectId.isValid(selectedCompanyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping company",
      });
    }

    const shippingCompany = await ShippingCompany.findById(selectedCompanyId);
    const paymentMethod = req.body?.cost?.paymentMethod;
    const shippingType = req.body?.shippingType;

    if (!shippingType || !["local", "international"].includes(shippingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping type",
      });
    }

    if (!["wallet", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    if (!shippingCompany || !shippingCompany.isActive) {
      return res.status(400).json({
        success: false,
        message: "Shipping company is not available",
      });
    }

    if (shippingType === "local" && !shippingCompany.supportsLocal) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not support local shipping",
      });
    }

    if (
      shippingType === "international" &&
      !shippingCompany.supportsInternational
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not support international shipping",
      });
    }

    if (paymentMethod === "cod" && !shippingCompany.codService?.enabled) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not support cash on delivery",
      });
    }

    const receivers = Array.isArray(req.body?.receivers)
      ? req.body.receivers
      : [];

    if (
      shippingType === "local" &&
      shippingCompany.supportedLocalStates?.length
    ) {
      const supportedStates = new Set(
        shippingCompany.supportedLocalStates.map((value) =>
          normalizeLocationValue(value),
        ),
      );

      const unsupportedReceiver = receivers.find((receiver) => {
        const normalizedState = normalizeLocationValue(receiver?.state);
        return normalizedState && !supportedStates.has(normalizedState);
      });

      if (unsupportedReceiver?.state) {
        return res.status(400).json({
          success: false,
          message: `Selected company does not support local state: ${unsupportedReceiver.state}`,
        });
      }
    }

    if (
      shippingType === "international" &&
      shippingCompany.supportedCountries?.length
    ) {
      const supportedCountries = new Set(
        shippingCompany.supportedCountries.map((value) =>
          normalizeLocationValue(value),
        ),
      );

      const unsupportedReceiver = receivers.find((receiver) => {
        const normalizedCountry = normalizeLocationValue(receiver?.country);
        return normalizedCountry && !supportedCountries.has(normalizedCountry);
      });

      if (unsupportedReceiver?.country) {
        return res.status(400).json({
          success: false,
          message: `Selected company does not support country: ${unsupportedReceiver.country}`,
        });
      }
    }

    const actualWeight = Number(req.body?.package?.weight) || 0;
    const length = Number(req.body?.package?.length) || 0;
    const width = Number(req.body?.package?.width) || 0;
    const height = Number(req.body?.package?.height) || 0;
    const volumetricDivisor =
      Number(shippingCompany.volumetricDivisor) > 0
        ? Number(shippingCompany.volumetricDivisor)
        : 6000;
    const volumetricWeight =
      length && width && height
        ? (length * width * height) / volumetricDivisor
        : 0;
    const billingWeight = Math.max(actualWeight, volumetricWeight);
    const pricePerKg =
      shippingType === "international"
        ? Number(shippingCompany.pricing?.internationalPerKgUSD || 0)
        : Number(shippingCompany.pricing?.localPerKgSYP || 0);

    const baseAmount = billingWeight * pricePerKg;
    const codFee =
      paymentMethod === "cod"
        ? Number(
            shippingType === "international"
              ? shippingCompany.codService?.internationalFeeUSD || 0
              : shippingCompany.codService?.localFeeSYP || 0,
          )
        : 0;
    const totalAmount = baseAmount + codFee;
    const costCurrency = shippingType === "international" ? "USD" : "SYP";

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const shipmentData = {
      ...req.body,
      userId: req.user.id,
      shippingCompany: {
        id: shippingCompany._id.toString(),
        name: shippingCompany.name,
        trackingUrlTemplate: shippingCompany.trackingUrlTemplate || "",
      },
      cost: {
        ...req.body.cost,
        amount: totalAmount,
        baseAmount,
        codFee,
        currency: costCurrency,
        paymentMethod,
        volumetricDivisor,
        volumetricWeight,
        actualWeight,
        billingWeight,
      },
    };

    const shipment = await Shipment.create(shipmentData);

    // Deduct cost from wallet if payment method is wallet
    if (shipment.cost.paymentMethod === "wallet") {
      const currency = shipment.cost.currency;

      if (currentUser.balance[currency] < shipment.cost.amount) {
        await Shipment.findByIdAndDelete(shipment._id);
        return res.status(400).json({
          success: false,
          message: "Insufficient balance",
        });
      }

      const balanceBefore = currentUser.balance[currency];
      currentUser.balance[currency] -= shipment.cost.amount;
      await currentUser.save();

      // Create transaction record
      const walletTransaction = await Transaction.create({
        userId: req.user.id,
        type: "payment",
        amount: shipment.cost.amount,
        currency: currency,
        status: "completed",
        method: "wallet",
        relatedShipment: shipment._id,
        description: `Payment for shipment ${shipment.trackingNumber}`,
        balanceBefore,
        balanceAfter: currentUser.balance[currency],
        processedAt: new Date(),
      });

      shipment.cost.isPaid = true;
      await shipment.save();

      await createAndEmitNotification(req, {
        userId: req.user.id,
        type: "wallet",
        titleAr: "خصم قيمة الشحنة",
        titleEn: "Shipment Payment Deducted",
        messageAr: `تم خصم ${shipment.cost.amount} ${currency} من محفظتك لقيمة الشحنة ${shipment.trackingNumber}.`,
        messageEn: `${shipment.cost.amount} ${currency} was deducted from your wallet for shipment ${shipment.trackingNumber}.`,
        metadata: {
          transactionId: walletTransaction._id,
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          amount: shipment.cost.amount,
          currency,
          paymentMethod: "wallet",
        },
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "create-shipment",
      category: "shipment",
      description: `Created shipment ${shipment.trackingNumber}`,
      targetId: shipment._id,
      targetModel: "Shipment",
    });

    // Emit socket event to admin
    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("new-shipment", {
        shipment,
        user: req.user,
      });
    }

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: shipment,
    });
  } catch (error) {
    console.error("Create shipment error:", error);

    if (error.name === "ValidationError") {
      const firstFieldError = Object.values(error.errors || {})[0];
      return res.status(400).json({
        success: false,
        message: firstFieldError?.message || "Invalid shipment data",
        error: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid shipment data format",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error creating shipment",
      error: error.message,
    });
  }
};

// @desc    Get user shipments
// @route   GET /api/shipments
// @access  Private
exports.getUserShipments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (req.user.role === "company-admin") {
      if (!req.user.shippingCompanyId) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }

      query["shippingCompany.id"] = req.user.shippingCompanyId.toString();
    } else if (!isPlatformAdmin(req.user)) {
      query.userId = req.user.id;
    }

    if (status) query.status = status;

    const shipments = await Shipment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Shipment.countDocuments(query);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shipments",
      error: error.message,
    });
  }
};

// @desc    Get shipment by ID
// @route   GET /api/shipments/:id
// @access  Private
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate(
      "userId",
      "name email phone",
    );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Check if user owns the shipment or is admin
    if (
      shipment.userId._id.toString() !== req.user.id &&
      !["admin", "super-admin"].includes(req.user.role) &&
      !(
        req.user.role === "company-admin" &&
        req.user.shippingCompanyId &&
        shipment.shippingCompany?.id === req.user.shippingCompanyId.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this shipment",
      });
    }

    res.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shipment",
      error: error.message,
    });
  }
};

// @desc    Track shipment by tracking number
// @route   GET /api/shipments/track/:trackingNumber
// @access  Public
exports.trackShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      trackingNumber: req.params.trackingNumber.toUpperCase(),
    }).select("-userId");

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    res.json({
      success: true,
      data: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        statusHistory: shipment.statusHistory,
        sender: shipment.sender,
        receivers: shipment.receivers,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error tracking shipment",
      error: error.message,
    });
  }
};

// @desc    Cancel shipment
// @route   PUT /api/shipments/:id/cancel
// @access  Private
exports.cancelShipment = async (req, res) => {
  try {
    const { reason } = req.body || {};

    if (!String(reason || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Check ownership
    if (shipment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this shipment",
      });
    }

    // Check if shipment can be cancelled
    if (["delivered", "cancelled", "returned"].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this shipment",
      });
    }

    if (shipment.cancellationRequest?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Cancellation request already submitted",
      });
    }

    shipment.cancellationRequest = {
      isRequested: true,
      reason: String(reason).trim(),
      status: "pending",
      requestedBy: req.user.id,
      requestedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: "",
    };

    shipment.statusHistory.push({
      status: shipment.status,
      note: `Cancellation requested by user: ${String(reason).trim()}`,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    await shipment.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "cancel-shipment",
      category: "shipment",
      description: `Requested cancellation for shipment ${shipment.trackingNumber}`,
      targetId: shipment._id,
      targetModel: "Shipment",
    });

    const io = req.app.get("io");
    if (io && shipment.shippingCompany?.id) {
      io.to(`company-room-${shipment.shippingCompany.id}`).emit(
        "cancellation-request-created",
        {
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          companyId: shipment.shippingCompany.id,
          companyName: shipment.shippingCompany.name,
          requestedBy: req.user.id,
          reason: shipment.cancellationRequest?.reason || "",
          requestedAt: shipment.cancellationRequest?.requestedAt || new Date(),
        },
      );
    }

    await createAndEmitNotification(req, {
      userId: shipment.userId,
      type: "shipment",
      titleAr: "تم إرسال طلب الإلغاء",
      titleEn: "Cancellation Request Submitted",
      messageAr: `تم إرسال طلب إلغاء الشحنة ${shipment.trackingNumber} وهو الآن قيد المراجعة.`,
      messageEn: `Your cancellation request for shipment ${shipment.trackingNumber} was submitted and is now under review.`,
      metadata: {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        requestStatus: "pending",
        reason: shipment.cancellationRequest?.reason || "",
      },
    });

    res.json({
      success: true,
      message: "Cancellation request submitted successfully",
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling shipment",
      error: error.message,
    });
  }
};
