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

const normalizeCountryCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const resolveInternationalPerKgRate = (company, countryCode, billingWeight) => {
  const fallbackRate = Number(company?.pricing?.internationalPerKgUSD || 0);
  const code = normalizeCountryCode(countryCode);

  if (!code) {
    return {
      rate: fallbackRate,
      zone: "",
      source: "fallback",
    };
  }

  const countryZoneMap = company?.internationalCountryZones;
  const rawZone =
    countryZoneMap && typeof countryZoneMap.get === "function"
      ? countryZoneMap.get(code)
      : countryZoneMap?.[code];

  const zone = String(rawZone || "")
    .trim()
    .toUpperCase();

  if (!zone) {
    return {
      rate: fallbackRate,
      zone: "",
      source: "fallback",
    };
  }

  const normalizedWeight =
    Number(billingWeight) > 0 ? Number(billingWeight) : 0;
  const zoneEntries = Array.isArray(company?.internationalZoneRates)
    ? company.internationalZoneRates
        .filter(
          (entry) =>
            String(entry?.zone || "")
              .trim()
              .toUpperCase() === zone,
        )
        .map((entry) => ({
          ...entry,
          minWeight: Number(entry?.minWeight || 0),
          maxWeight: Number(entry?.maxWeight || 0),
          perKgUSD: Number(entry?.perKgUSD || 0),
        }))
    : [];

  const zoneRateEntry = zoneEntries
    .sort((a, b) => {
      const minDiff = b.minWeight - a.minWeight;
      if (minDiff !== 0) return minDiff;

      const aMax = a.maxWeight > 0 ? a.maxWeight : Number.POSITIVE_INFINITY;
      const bMax = b.maxWeight > 0 ? b.maxWeight : Number.POSITIVE_INFINITY;
      return aMax - bMax;
    })
    .find((entry) => {
      const min = entry.minWeight >= 0 ? entry.minWeight : 0;
      const max =
        entry.maxWeight > 0 ? entry.maxWeight : Number.POSITIVE_INFINITY;
      return normalizedWeight >= min && normalizedWeight <= max;
    });

  if (!zoneRateEntry) {
    return {
      rate: fallbackRate,
      zone,
      source: "fallback",
    };
  }

  return {
    rate: Number(zoneRateEntry.perKgUSD || 0),
    zone,
    source: "zone",
  };
};

const isOfferActive = (offer, now = Date.now()) => {
  if (!offer?.title || !offer?.isActive) return false;

  const startAt = offer.startAt ? new Date(offer.startAt).getTime() : null;
  const endAt = offer.endAt ? new Date(offer.endAt).getTime() : null;

  if (startAt && !Number.isNaN(startAt) && startAt > now) return false;
  if (endAt && !Number.isNaN(endAt) && endAt < now) return false;

  return true;
};

const resolveShipmentOffer = (company, offerId) => {
  const offers = Array.isArray(company?.offers) ? company.offers : [];
  const activeOffers = offers
    .filter((offer) => isOfferActive(offer))
    .sort(
      (left, right) =>
        Number(right?.priority || 0) - Number(left?.priority || 0),
    );

  if (!activeOffers.length) return null;
  if (!offerId) return activeOffers[0];

  return (
    activeOffers.find(
      (offer) => String(offer?._id || "") === String(offerId || ""),
    ) || activeOffers[0]
  );
};

// Export helper utilities for use by other controllers (admin recalculation, etc.)
exports.resolveInternationalPerKgRate = resolveInternationalPerKgRate;
exports.resolveShipmentOffer = resolveShipmentOffer;

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private
exports.createShipment = async (req, res) => {
  try {
    // دعم استقبال FormData: إذا كان هناك ملف packageImage، استخرج البيانات من req.body.data
    let body = req.body;
    let packageImageInfo = null;
    if (req.file && req.file.fieldname === "packageImage") {
      // إذا أتى body كـ JSON string (لأننا أرسلناه في حقل data)
      if (typeof req.body.data === "string") {
        body = JSON.parse(req.body.data);
      }
      packageImageInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date(),
      };
    }
    const selectedCompanyId = body?.shippingCompany?.id;
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
    const paymentMethod = body?.cost?.paymentMethod;
    const shippingType = body?.shippingType;
    const shippingMode = body?.shippingMode || "standard";
    const packagingRequested = Boolean(body?.package?.packagingRequested);

    if (!shippingType || !["local", "international"].includes(shippingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping type",
      });
    }

    if (!["standard", "express"].includes(shippingMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping mode",
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

    if (
      shippingMode === "express" &&
      !shippingCompany.expressService?.enabled
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not support express shipping",
      });
    }

    if (packagingRequested && !shippingCompany.packagingService?.enabled) {
      return res.status(400).json({
        success: false,
        message: "Selected company does not support packaging service",
      });
    }

    const receivers = Array.isArray(body?.receivers) ? body.receivers : [];

    if (shippingType === "international") {
      const normalizedSenderCountry = normalizeLocationValue(
        req.body?.sender?.country,
      );
      const sameCountryReceiver = receivers.find((receiver) => {
        const normalizedReceiverCountry = normalizeLocationValue(
          receiver?.country,
        );
        return (
          normalizedSenderCountry &&
          normalizedReceiverCountry &&
          normalizedSenderCountry === normalizedReceiverCountry
        );
      });

      if (sameCountryReceiver?.country) {
        return res.status(400).json({
          success: false,
          message:
            "For international shipping, sender country cannot be the same as receiver country",
        });
      }
    }

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

    const actualWeight = Number(body?.package?.weight) || 0;
    const length = Number(body?.package?.length) || 0;
    const width = Number(body?.package?.width) || 0;
    const height = Number(body?.package?.height) || 0;
    const volumetricDivisor =
      Number(shippingCompany.volumetricDivisor) > 0
        ? Number(shippingCompany.volumetricDivisor)
        : 6000;
    const volumetricWeight =
      length && width && height
        ? (length * width * height) / volumetricDivisor
        : 0;
    const billingWeight = Math.max(actualWeight, volumetricWeight);
    const firstReceiverCountry = receivers[0]?.country;
    const internationalRate = resolveInternationalPerKgRate(
      shippingCompany,
      firstReceiverCountry,
      billingWeight,
    );
    const pricePerKg =
      shippingType === "international"
        ? internationalRate.rate
        : Number(shippingCompany.pricing?.localPerKgSYP || 0);

    const selectedOffer = resolveShipmentOffer(shippingCompany, body?.offerId);

    const baseAmount = selectedOffer
      ? Number(
          shippingType === "international"
            ? (selectedOffer.internationalPriceUSD ??
                selectedOffer.internationalPrice ??
                0)
            : (selectedOffer.localPriceSYP ?? selectedOffer.localPrice ?? 0),
        )
      : billingWeight * pricePerKg;
    const codFee =
      paymentMethod === "cod"
        ? Number(
            selectedOffer
              ? shippingType === "international"
                ? selectedOffer.codFeeUSD || 0
                : (selectedOffer.codFeeSYP ?? selectedOffer.codFee ?? 0)
              : shippingType === "international"
                ? shippingCompany.codService?.internationalFeeUSD || 0
                : shippingCompany.codService?.localFeeSYP || 0,
          )
        : 0;
    const expressFee =
      shippingMode === "express"
        ? Number(
            selectedOffer
              ? shippingType === "international"
                ? selectedOffer.expressFeeUSD || 0
                : selectedOffer.expressFeeSYP || 0
              : shippingType === "international"
                ? shippingCompany.expressService?.internationalFeeUSD || 0
                : shippingCompany.expressService?.localFeeSYP || 0,
          )
        : 0;
    const packagingFee =
      packagingRequested && shippingCompany.packagingService?.enabled
        ? Number(
            shippingType === "international"
              ? shippingCompany.packagingService?.internationalFeeUSD || 0
              : shippingCompany.packagingService?.localFeeSYP || 0,
          )
        : 0;
    const totalAmount = baseAmount + codFee + expressFee + packagingFee;
    const safeTotalAmount = Number(totalAmount || 0) < 0 ? 0 : Number(totalAmount || 0);
    const costCurrency = shippingType === "international" ? "USD" : "SYP";

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const shipmentData = {
      ...body,
      userId: req.user.id,
      shippingMode,
      shippingCompany: {
        id: shippingCompany._id.toString(),
        name: shippingCompany.name,
        trackingUrlTemplate: shippingCompany.trackingUrlTemplate || "",
      },
      cost: {
        ...body.cost,
        amount: safeTotalAmount,
        baseAmount,
        codFee,
        expressFee,
        packagingFee,
        currency: costCurrency,
        paymentMethod,
        zone: shippingType === "international" ? internationalRate.zone : "",
        zoneRateSource:
          shippingType === "international" ? internationalRate.source : "",
        volumetricDivisor,
        volumetricWeight,
        actualWeight,
        billingWeight,
      },
      package: {
        ...body.package,
        packagingRequested,
      },
      documents: packageImageInfo ? [packageImageInfo] : [],
    };

    const shipment = await Shipment.create(shipmentData);
    let updatedWalletBalance = null;

    // Deduct cost from wallet if payment method is wallet
    const shipmentPaymentMethod = String(shipment.cost.paymentMethod || "").trim().toLowerCase();
    if (shipmentPaymentMethod === "wallet") {
      const currency = String(shipment.cost.currency || "SYP").toUpperCase();
      const rawAmount = shipment.cost.amount;
      let amount = Number(rawAmount);

      if (!Number.isFinite(amount)) {
        amount =
          Number(shipment.cost.baseAmount || 0) +
          Number(shipment.cost.codFee || 0) +
          Number(shipment.cost.expressFee || 0) +
          Number(shipment.cost.packagingFee || 0);
      }

      if (!Number.isFinite(amount) || amount < 0) {
        console.warn(
          `Negative or invalid shipment amount for wallet payment on shipment ${shipment._id}:`,
          rawAmount,
        );
        amount = 0;
      }

      const userBalance = Number(currentUser.balance?.[currency] || 0);

      if (amount > 0) {
        if (userBalance < amount) {
          await Shipment.findByIdAndDelete(shipment._id);
          return res.status(400).json({
            success: false,
            message: "Insufficient balance",
          });
        }

        const balanceBefore = userBalance;
        const expectedBalanceAfter = balanceBefore - amount;
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: currentUser._id,
            [`balance.${currency}`]: { $gte: amount },
          },
          { $inc: { [`balance.${currency}`]: -amount } },
          { new: true, runValidators: true },
        );

        if (!updatedUser) {
          await Shipment.findByIdAndDelete(shipment._id);
          return res.status(500).json({
            success: false,
            message: "Unable to update wallet balance",
          });
        }

        const balanceAfter = Number(updatedUser.balance?.[currency] || 0);
        const normalizedBalance = {
          USD: Number(updatedUser.balance?.USD || 0),
          SYP: Number(updatedUser.balance?.SYP || 0),
        };
        updatedWalletBalance = normalizedBalance;

        if (balanceAfter !== expectedBalanceAfter) {
          console.warn(
            `Wallet deduction mismatch for user ${req.user.id}: expected ${expectedBalanceAfter}, got ${balanceAfter}`,
          );
        }

        // Create transaction record
        const walletTransaction = await Transaction.create({
          userId: req.user.id,
          type: "payment",
          amount,
          currency,
          status: "completed",
          method: "wallet",
          relatedShipment: shipment._id,
          description: `Payment for shipment ${shipment.trackingNumber}`,
          balanceBefore,
          balanceAfter,
          processedAt: new Date(),
        });

        shipment.cost.isPaid = true;
        await shipment.save();

        await createAndEmitNotification(req, {
          userId: req.user.id,
          type: "wallet",
          titleAr: "خصم قيمة الشحنة",
          titleEn: "Shipment Payment Deducted",
          messageAr: `تم خصم ${amount} ${currency} من محفظتك لقيمة الشحنة ${shipment.trackingNumber}.`,
          messageEn: `${amount} ${currency} was deducted from your wallet for shipment ${shipment.trackingNumber}.`,
          metadata: {
            transactionId: walletTransaction._id,
            shipmentId: shipment._id,
            trackingNumber: shipment.trackingNumber,
            amount,
            currency,
            paymentMethod: "wallet",
          },
          updatedBalance: normalizedBalance,
        });
      } else {
        if (rawAmount !== 0 && rawAmount != null) {
          console.warn(
            `Wallet payment selected but calculated wallet amount is zero for shipment ${shipment._id}`,
            {
              rawAmount,
              baseAmount: shipment.cost.baseAmount,
              codFee: shipment.cost.codFee,
              expressFee: shipment.cost.expressFee,
              packagingFee: shipment.cost.packagingFee,
            },
          );
        }

        shipment.cost.isPaid = true;
        await shipment.save();
      }
    }

    await createAndEmitNotification(req, {
      userId: req.user.id,
      type: "shipment",
      titleAr: "تم إنشاء الشحنة",
      titleEn: "Shipment Created",
      messageAr: `تم إنشاء الشحنة ${shipment.trackingNumber} بنجاح.`,
      messageEn: `Your shipment ${shipment.trackingNumber} was created successfully.`,
      metadata: {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        paymentMethod: shipment.cost.paymentMethod,
        amount: shipment.cost.amount,
        currency: shipment.cost.currency,
      },
    });

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

    const responsePayload = {
      shipment,
      ...(updatedWalletBalance
        ? { balance: updatedWalletBalance }
        : {}),
    };

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: responsePayload,
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
    const {
      status,
      search,
      company,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (req.user.role === "company-admin") {
      if (!req.user.shippingCompanyId) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
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

    if (company && company !== "all") {
      query["shippingCompany.name"] = company;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!Number.isNaN(fromDate.getTime())) {
          query.createdAt.$gte = fromDate;
        }
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        if (!Number.isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "sender.phone": { $regex: search, $options: "i" } },
        { "sender.email": { $regex: search, $options: "i" } },
        { "receivers.0.name": { $regex: search, $options: "i" } },
        { "receivers.0.phone": { $regex: search, $options: "i" } },
        { "receivers.0.email": { $regex: search, $options: "i" } },
      ];
    }

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

// @desc    Request shipment edit
// @route   PUT /api/shipments/:id/edit-request
// @access  Private
exports.requestShipmentEdit = async (req, res) => {
  try {
    const { reason, requestedChanges } = req.body || {};
    const normalizedReason = String(reason || "").trim();
    const normalizedRequestedChanges = String(requestedChanges || "").trim();

    if (!normalizedReason) {
      return res.status(400).json({
        success: false,
        message: "Edit request reason is required",
      });
    }

    if (!normalizedRequestedChanges) {
      return res.status(400).json({
        success: false,
        message: "Requested changes details are required",
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (shipment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this shipment",
      });
    }

    if (shipment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending shipments can be edited",
      });
    }

    if (shipment.cancellationRequest?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot request edit while cancellation request is pending",
      });
    }

    if (shipment.editRequest?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Edit request already submitted",
      });
    }

    shipment.editRequest = {
      isRequested: true,
      reason: normalizedReason,
      requestedChanges: normalizedRequestedChanges,
      status: "pending",
      requestedBy: req.user.id,
      requestedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: "",
    };

    shipment.statusHistory.push({
      status: shipment.status,
      note: `Shipment edit requested by user: ${normalizedRequestedChanges}`,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    await shipment.save();

    try {
      await ActivityLog.create({
        userId: req.user.id,
        action: "edit-shipment-request",
        category: "shipment",
        description: `Requested shipment edit for ${shipment.trackingNumber}`,
        targetId: shipment._id,
        targetModel: "Shipment",
        metadata: {
          reason: normalizedReason,
          requestedChanges: normalizedRequestedChanges,
        },
      });
    } catch (activityLogError) {
      console.error(
        "requestShipmentEdit activity log error:",
        activityLogError,
      );
    }

    const io = req.app.get("io");
    if (io && shipment.shippingCompany?.id) {
      io.to(`company-room-${shipment.shippingCompany.id}`).emit(
        "edit-request-created",
        {
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          companyId: shipment.shippingCompany.id,
          companyName: shipment.shippingCompany.name,
          requestedBy: req.user.id,
          reason: shipment.editRequest?.reason || "",
          requestedChanges: shipment.editRequest?.requestedChanges || "",
          requestedAt: shipment.editRequest?.requestedAt || new Date(),
        },
      );

      io.to("admin-room").emit("edit-request-created", {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        companyId: shipment.shippingCompany.id,
        companyName: shipment.shippingCompany.name,
        requestedBy: req.user.id,
        reason: shipment.editRequest?.reason || "",
        requestedChanges: shipment.editRequest?.requestedChanges || "",
        requestedAt: shipment.editRequest?.requestedAt || new Date(),
      });
    }

    try {
      await createAndEmitNotification(req, {
        userId: shipment.userId,
        type: "shipment",
        titleAr: "تم إرسال طلب تعديل الشحنة",
        titleEn: "Shipment Edit Request Submitted",
        messageAr: `تم إرسال طلب تعديل الشحنة ${shipment.trackingNumber} وهو الآن قيد المراجعة.`,
        messageEn: `Your shipment edit request for ${shipment.trackingNumber} was submitted and is now under review.`,
        metadata: {
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          requestType: "edit",
          requestStatus: "pending",
        },
      });
    } catch (notificationError) {
      console.error(
        "requestShipmentEdit notification error:",
        notificationError,
      );
    }

    res.json({
      success: true,
      message: "Shipment edit request submitted successfully",
      data: shipment,
    });
  } catch (error) {
    console.error("requestShipmentEdit error:", error);
    res.status(500).json({
      success: false,
      message: `Error requesting shipment edit: ${error.message}`,
      error: error.message,
    });
  }
};
