// @desc    Update shipping company
// @route   PUT /api/admin/companies/:id
// @access  Private/Admin
const parseDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeOffers = (offersPayload) => {
  if (!Array.isArray(offersPayload)) return [];

  return offersPayload
    .map((offer = {}) => {
      const durationDays = Math.max(0, Number(offer.durationDays || 0));
      const durationHours = Math.max(0, Number(offer.durationHours || 0));
      const startAt = parseDateOrNull(offer.startAt);
      let endAt = parseDateOrNull(offer.endAt);
      const durationMs = (durationDays * 24 + durationHours) * 60 * 60 * 1000;

      if (!endAt && durationMs > 0) {
        const baseDate = startAt || new Date();
        endAt = new Date(baseDate.getTime() + durationMs);
      }

      const localPriceSYP = Number(
        offer.localPriceSYP ?? offer.localPrice ?? 0,
      );
      // Business rule: local offer shipping is stored in SYP only.
      const localPriceUSD = 0;
      // Business rule: international offer shipping is stored in USD only.
      const internationalPriceSYP = 0;
      const internationalPriceUSD = Number(
        offer.internationalPriceUSD ?? offer.internationalPrice ?? 0,
      );
      const codFeeSYP = Number(offer.codFeeSYP ?? offer.codFee ?? 0);
      const codFeeUSD = Number(offer.codFeeUSD ?? 0);
      const packagingFeeSYP = Number(offer.packagingFeeSYP ?? 0);
      const packagingFeeUSD = Number(offer.packagingFeeUSD ?? 0);

      return {
        title: String(offer.title || "").trim(),
        titleEn: String(offer.titleEn || "").trim(),
        subtitle: String(offer.subtitle || "").trim(),
        subtitleEn: String(offer.subtitleEn || "").trim(),
        description: String(offer.description || "").trim(),
        descriptionEn: String(offer.descriptionEn || "").trim(),
        imageUrl: String(offer.imageUrl || "").trim(),
        ctaText: String(offer.ctaText || "").trim(),
        ctaTextEn: String(offer.ctaTextEn || "").trim(),
        ctaLink: String(offer.ctaLink || "").trim(),
        background: String(offer.background || "").trim(),
        localPrice: localPriceSYP,
        internationalPrice: internationalPriceUSD,
        codFee: codFeeSYP,
        localPriceSYP,
        localPriceUSD,
        internationalPriceSYP,
        internationalPriceUSD,
        codFeeSYP,
        codFeeUSD,
        expressFeeSYP: Number(offer.expressFeeSYP || 0),
        expressFeeUSD: Number(offer.expressFeeUSD || 0),
        packagingFeeSYP,
        packagingFeeUSD,
        durationDays,
        durationHours,
        priority: Number(offer.priority || 0),
        isActive: Boolean(offer.isActive),
        startAt,
        endAt,
      };
    })
    .filter((offer) => offer.title || offer.titleEn)
    .filter(
      (offer) =>
        !offer.startAt ||
        !offer.endAt ||
        Number.isNaN(offer.startAt.getTime()) ||
        Number.isNaN(offer.endAt.getTime()) ||
        offer.endAt >= offer.startAt,
    );
};

const applyCompanyUpdates = (company, updates = {}) => {
  const nestedMergeKeys = new Set([
    "expressService",
    "codService",
    "packagingService",
    "pricing",
  ]);

  Object.keys(updates).forEach((key) => {
    const nextValue = updates[key];

    if (nestedMergeKeys.has(key)) {
      Object.assign(company[key], nextValue || {});
      return;
    }

    if (key === "offers") {
      company.offers = normalizeOffers(nextValue);
      return;
    }

    if (key === "internationalZoneRates") {
      const cleanedRates = Array.isArray(nextValue)
        ? nextValue
            .map((entry) => ({
              zone: String(entry?.zone || "")
                .trim()
                .toUpperCase(),
              minWeight: Math.max(0, Number(entry?.minWeight || 0)),
              maxWeight: Math.max(0, Number(entry?.maxWeight || 0)),
              perKgUSD: Number(entry?.perKgUSD || 0),
            }))
            .filter(
              (entry) =>
                entry.zone &&
                (entry.maxWeight <= 0 || entry.maxWeight >= entry.minWeight),
            )
        : [];
      company.internationalZoneRates = cleanedRates;
      return;
    }

    if (key === "internationalCountryZones") {
      const normalizedMap = {};
      if (nextValue && typeof nextValue === "object") {
        Object.entries(nextValue).forEach(([countryCode, zone]) => {
          const normalizedCountry = String(countryCode || "")
            .trim()
            .toUpperCase();
          const normalizedZone = String(zone || "")
            .trim()
            .toUpperCase();
          if (!normalizedCountry || !normalizedZone) return;
          normalizedMap[normalizedCountry] = normalizedZone;
        });
      }
      company.internationalCountryZones = normalizedMap;
      return;
    }

    company[key] = nextValue;
  });
};

exports.updateCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const updates = req.body;
    const company = await ShippingCompany.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Shipping company not found",
      });
    }

    if (
      req.user?.role === "company-admin" &&
      req.user.shippingCompanyId &&
      company._id.toString() !== req.user.shippingCompanyId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this company",
      });
    }

    applyCompanyUpdates(company, updates);

    await company.save();
    res.json({
      success: true,
      message: "Shipping company updated successfully",
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating shipping company",
      error: error.message,
    });
  }
};

// @desc    Get shipping company by id
// @route   GET /api/admin/companies/:id
// @access  Private/Admin
exports.getCompanyById = async (req, res) => {
  try {
    const company = await ShippingCompany.findById(req.params.id).populate(
      "ownerUserId",
      "name email phone",
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Shipping company not found",
      });
    }

    if (
      req.user?.role === "company-admin" &&
      req.user.shippingCompanyId &&
      company._id.toString() !== req.user.shippingCompanyId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this company",
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shipping company",
      error: error.message,
    });
  }
};

// @desc    Create or update a company admin account
// @route   POST /api/admin/companies/:id/admin-account
// @access  Private/Admin
exports.upsertCompanyAdminAccount = async (req, res) => {
  try {
    const companyId = req.params.id;
    const { name, email, phone, password, resetPassword } = req.body || {};

    const company = await ShippingCompany.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Shipping company not found",
      });
    }

    if (
      req.user?.role === "company-admin" &&
      req.user.shippingCompanyId &&
      company._id.toString() !== req.user.shippingCompanyId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage admin account for this company",
      });
    }

    let companyAdmin = await User.findOne({
      role: "company-admin",
      shippingCompanyId: companyId,
    });

    if (!companyAdmin) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to create company admin account",
        });
      }

      companyAdmin = new User({
        name: String(name || company.name).trim(),
        email: String(email || "").trim().toLowerCase(),
        phone: String(phone || "").trim(),
        password: String(password),
        role: "company-admin",
        shippingCompanyId: companyId,
        isVerified: true,
      });
    } else {
      if (name !== undefined) companyAdmin.name = String(name).trim();
      if (email !== undefined) companyAdmin.email = String(email).trim().toLowerCase();
      if (phone !== undefined) companyAdmin.phone = String(phone).trim();

      if (password) {
        companyAdmin.password = String(password);
      } else if (resetPassword) {
        const tempPassword = `Shipme${Math.floor(Math.random() * 900000 + 100000)}`;
        companyAdmin.password = tempPassword;
      }
    }

    await companyAdmin.save();

    res.json({
      success: true,
      message: "Company admin account saved successfully",
      data: {
        id: companyAdmin._id,
        name: companyAdmin.name,
        email: companyAdmin.email,
        phone: companyAdmin.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already in use",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error saving company admin account",
      error: error.message,
    });
  }
};

// @desc    Get current company for company-admin
// @route   GET /api/admin/companies/me
// @access  Private/CompanyAdmin
exports.getMyCompany = async (req, res) => {
  try {
    if (!req.user?.shippingCompanyId) {
      return res.status(404).json({
        success: false,
        message: "No shipping company is linked to this account",
      });
    }

    const company = await ShippingCompany.findById(
      req.user.shippingCompanyId,
    ).populate("ownerUserId", "name email phone");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Shipping company not found",
      });
    }

    return res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching company profile",
      error: error.message,
    });
  }
};

// @desc    Update current company for company-admin
// @route   PUT /api/admin/companies/me
// @access  Private/CompanyAdmin
exports.updateMyCompany = async (req, res) => {
  try {
    if (!req.user?.shippingCompanyId) {
      return res.status(404).json({
        success: false,
        message: "No shipping company is linked to this account",
      });
    }

    const company = await ShippingCompany.findById(req.user.shippingCompanyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Shipping company not found",
      });
    }

    const updates = req.body || {};
    applyCompanyUpdates(company, updates);

    await company.save();

    return res.json({
      success: true,
      message: "Company settings updated successfully",
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating company profile",
      error: error.message,
    });
  }
};
const User = require("../models/User");
const Shipment = require("../models/Shipment");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");
const ShippingCompany = require("../models/ShippingCompany");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { createAndEmitNotification } = require("./notificationController");

const EDITABLE_SHIPMENT_TOP_LEVEL_FIELDS = new Set([
  "sender",
  "receivers",
  "package",
]);

const EDITABLE_SHIPMENT_NESTED_FIELDS = {
  sender: new Set(["name", "phone", "email"]),
  receivers: new Set(["name", "phone", "email"]),
  package: new Set(["type", "description", "fragile", "packagingRequested"]),
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const sanitizeAllowedFields = (value, allowedKeys) => {
  if (!isPlainObject(value)) return {};

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (!allowedKeys.has(key)) return;
    next[key] = nestedValue;
  });

  return next;
};

const pickEditableShipmentUpdates = (updates) => {
  if (!isPlainObject(updates)) {
    return { sanitizedUpdates: {}, rejectedKeys: [] };
  }

  const sanitizedUpdates = {};
  const rejectedKeys = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (!EDITABLE_SHIPMENT_TOP_LEVEL_FIELDS.has(key)) {
      rejectedKeys.push(key);
      return;
    }

    if (key === "sender") {
      if (!isPlainObject(value)) {
        rejectedKeys.push(key);
        return;
      }
      sanitizedUpdates.sender = sanitizeAllowedFields(
        value,
        EDITABLE_SHIPMENT_NESTED_FIELDS.sender,
      );
      Object.keys(value).forEach((nestedKey) => {
        if (!EDITABLE_SHIPMENT_NESTED_FIELDS.sender.has(nestedKey)) {
          rejectedKeys.push(`sender.${nestedKey}`);
        }
      });
      return;
    }

    if (key === "receivers") {
      if (!Array.isArray(value)) {
        rejectedKeys.push(key);
        return;
      }
      sanitizedUpdates.receivers = value.map((item) => {
        if (!isPlainObject(item)) return item;
        const next = sanitizeAllowedFields(
          item,
          EDITABLE_SHIPMENT_NESTED_FIELDS.receivers,
        );
        Object.keys(item).forEach((nestedKey) => {
          if (!EDITABLE_SHIPMENT_NESTED_FIELDS.receivers.has(nestedKey)) {
            rejectedKeys.push(`receivers.${nestedKey}`);
          }
        });
        return next;
      });
      return;
    }

    if (key === "package") {
      if (!isPlainObject(value)) {
        rejectedKeys.push(key);
        return;
      }
      sanitizedUpdates.package = sanitizeAllowedFields(
        value,
        EDITABLE_SHIPMENT_NESTED_FIELDS.package,
      );
      Object.keys(value).forEach((nestedKey) => {
        if (!EDITABLE_SHIPMENT_NESTED_FIELDS.package.has(nestedKey)) {
          rejectedKeys.push(`package.${nestedKey}`);
        }
      });
      return;
    }
  });

  return { sanitizedUpdates, rejectedKeys };
};

const toPlainObject = (value) => {
  if (value && typeof value.toObject === "function") {
    return value.toObject();
  }
  return isPlainObject(value) ? value : {};
};

const mergeEditableShipmentUpdates = (shipment, sanitizedUpdates) => {
  const mergedUpdates = { ...sanitizedUpdates };

  if (isPlainObject(mergedUpdates.sender)) {
    mergedUpdates.sender = {
      ...toPlainObject(shipment.sender),
      ...mergedUpdates.sender,
    };
  }

  if (isPlainObject(mergedUpdates.package)) {
    mergedUpdates.package = {
      ...toPlainObject(shipment.package),
      ...mergedUpdates.package,
    };
  }

  if (Array.isArray(mergedUpdates.receivers)) {
    const existingReceivers = Array.isArray(shipment.receivers)
      ? shipment.receivers.map((receiver) => toPlainObject(receiver))
      : [];

    const incomingReceivers = mergedUpdates.receivers;
    if (!incomingReceivers.length) {
      delete mergedUpdates.receivers;
      return mergedUpdates;
    }

    mergedUpdates.receivers = incomingReceivers.map((incomingReceiver, idx) => {
      const baseReceiver = existingReceivers[idx] || {};
      if (isPlainObject(incomingReceiver)) {
        return {
          ...baseReceiver,
          ...incomingReceiver,
        };
      }
      return Object.keys(baseReceiver).length ? baseReceiver : incomingReceiver;
    });

    if (
      mergedUpdates.receivers.length < existingReceivers.length &&
      mergedUpdates.receivers.length > 0
    ) {
      mergedUpdates.receivers.push(
        ...existingReceivers.slice(mergedUpdates.receivers.length),
      );
    }
  }

  return mergedUpdates;
};

const recalculateShipmentCost = async (shipment) => {
  const ShippingCompany = require("../models/ShippingCompany");
  const {
    resolveInternationalPerKgRate,
    resolveShipmentOffer,
  } = require("./shipmentController");

  const shippingCompany = await ShippingCompany.findById(
    shipment.shippingCompany?.id,
  );
  if (!shippingCompany) {
    throw new Error("Associated shipping company not found");
  }

  const newShippingMode = shipment.shippingMode || "standard";
  if (newShippingMode === "express" && !shippingCompany.expressService?.enabled) {
    throw new Error("Selected company does not support express shipping");
  }

  const newPackagingRequested = Boolean(
    shipment.package?.packagingRequested || false,
  );
  if (
    newPackagingRequested &&
    !shippingCompany.packagingService?.enabled
  ) {
    throw new Error("Selected company does not support packaging service");
  }

  const paymentMethod = String(
    shipment.cost?.paymentMethod || "wallet",
  ).trim();
  if (paymentMethod === "cod" && !shippingCompany.codService?.enabled) {
    throw new Error(
      "Selected company does not support cash on delivery",
    );
  }

  const actualWeight = Number(shipment.package?.weight || 0);
  const length = Number(shipment.package?.length || 0);
  const width = Number(shipment.package?.width || 0);
  const height = Number(shipment.package?.height || 0);
  const volumetricDivisor = Number(
    shipment.cost?.volumetricDivisor ||
      shippingCompany.volumetricDivisor ||
      6000,
  );
  const volumetricWeight =
    length && width && height
      ? (length * width * height) / volumetricDivisor
      : 0;
  const billingWeight = Math.max(actualWeight, volumetricWeight);
  const firstReceiverCountry = shipment.receivers?.[0]?.country;
  const internationalRate = resolveInternationalPerKgRate(
    shippingCompany,
    firstReceiverCountry,
    billingWeight,
  );
  const pricePerKg =
    shipment.shippingType === "international"
      ? internationalRate.rate
      : Number(shippingCompany.pricing?.localPerKgSYP || 0);

  const selectedOffer = resolveShipmentOffer(
    shippingCompany,
    shipment.offerId,
  );

  const baseAmount = selectedOffer
    ? Number(
        shipment.shippingType === "international"
          ? selectedOffer.internationalPriceUSD ?? selectedOffer.internationalPrice ?? 0
          : selectedOffer.localPriceSYP ?? selectedOffer.localPrice ?? 0,
      )
    : billingWeight * pricePerKg;

  const codFee = paymentMethod === "cod"
    ? Number(
        selectedOffer
          ? shipment.shippingType === "international"
            ? selectedOffer.codFeeUSD || 0
            : selectedOffer.codFeeSYP ?? selectedOffer.codFee ?? 0
          : shipment.shippingType === "international"
            ? shippingCompany.codService?.internationalFeeUSD || 0
            : shippingCompany.codService?.localFeeSYP || 0,
      )
    : 0;

  const expressFee = newShippingMode === "express"
    ? Number(
        selectedOffer
          ? shipment.shippingType === "international"
            ? selectedOffer.expressFeeUSD || 0
            : selectedOffer.expressFeeSYP || 0
          : shipment.shippingType === "international"
            ? shippingCompany.expressService?.internationalFeeUSD || 0
            : shippingCompany.expressService?.localFeeSYP || 0,
      )
    : 0;

  const packagingFee = newPackagingRequested
    ? Number(
        shipment.shippingType === "international"
          ? shippingCompany.packagingService?.internationalFeeUSD || 0
          : shippingCompany.packagingService?.localFeeSYP || 0,
      )
    : 0;

  const totalAmount = baseAmount + codFee + expressFee + packagingFee;
  const safeTotalAmount = Number(totalAmount || 0) < 0 ? 0 : Number(totalAmount || 0);
  const costCurrency = shipment.shippingType === "international" ? "USD" : "SYP";

  shipment.cost = {
    ...(shipment.cost || {}),
    amount: safeTotalAmount,
    baseAmount,
    codFee,
    expressFee,
    packagingFee,
    currency: costCurrency,
    paymentMethod,
    volumetricDivisor,
    volumetricWeight,
    actualWeight,
    billingWeight,
  };
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const isCompanyAdmin = req.user?.role === "company-admin";
    const companyId = String(req.user?.shippingCompanyId || "");
    const companyFilter = isCompanyAdmin
      ? { "shippingCompany.id": companyId }
      : {};

    const currentCompany = isCompanyAdmin
      ? await ShippingCompany.findById(companyId).lean()
      : null;

    // Users stats
    const totalUsers = await User.countDocuments({ role: "user" });
    const newUsers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: daysAgo },
    });
    const activeUsers = await User.countDocuments({
      role: "user",
      isActive: true,
    });

    // Shipments stats
    const totalShipments = await Shipment.countDocuments(companyFilter);
    const pendingShipments = await Shipment.countDocuments({
      ...companyFilter,
      status: "pending",
    });
    const inTransitShipments = await Shipment.countDocuments({
      ...companyFilter,
      status: "in-transit",
    });
    const deliveredShipments = await Shipment.countDocuments({
      ...companyFilter,
      status: "delivered",
    });
    const newShipments = await Shipment.countDocuments({
      ...companyFilter,
      createdAt: { $gte: daysAgo },
    });

    // Revenue stats
    const revenueMatch = {
      type: "payment",
      status: "completed",
      createdAt: { $gte: daysAgo },
    };

    const revenueData = await Transaction.aggregate([
      { $match: revenueMatch },
      {
        $lookup: {
          from: "shipments",
          localField: "relatedShipment",
          foreignField: "_id",
          as: "shipment",
        },
      },
      { $unwind: { path: "$shipment", preserveNullAndEmptyArrays: true } },
      {
        $match: isCompanyAdmin
          ? { "shipment.shippingCompany.id": companyId }
          : {},
      },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const revenue = {
      USD: revenueData.find((r) => r._id === "USD")?.total || 0,
      SYP: revenueData.find((r) => r._id === "SYP")?.total || 0,
    };

    const withdrawalMatch = {
      type: "withdrawal",
      status: "pending",
    };

    const withdrawalRequestsData = await Transaction.aggregate([
      { $match: withdrawalMatch },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ...(isCompanyAdmin
        ? [{ $match: { "user.shippingCompanyId": companyId } }]
        : []),
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const companyMatchWhenAdmin = isCompanyAdmin
      ? { "shipment.shippingCompany.id": companyId }
      : {};

    const companyRevenueData = await Transaction.aggregate([
      {
        $match: {
          type: "payment",
          status: "completed",
          createdAt: { $gte: daysAgo },
          relatedShipment: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "shipments",
          localField: "relatedShipment",
          foreignField: "_id",
          as: "shipment",
        },
      },
      { $unwind: "$shipment" },
      { $match: companyMatchWhenAdmin },
      {
        $group: {
          _id: "$shipment.shippingCompany.id",
          companyName: { $first: "$shipment.shippingCompany.name" },
          revenueUSD: {
            $sum: {
              $cond: [{ $eq: ["$currency", "USD"] }, "$amount", 0],
            },
          },
          revenueSYP: {
            $sum: {
              $cond: [{ $eq: ["$currency", "SYP"] }, "$amount", 0],
            },
          },
          transactionsCount: { $sum: 1 },
          shipments: { $addToSet: "$relatedShipment" },
          users: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 0,
          companyId: "$_id",
          companyName: 1,
          revenue: {
            USD: "$revenueUSD",
            SYP: "$revenueSYP",
          },
          transactionsCount: 1,
          shipmentsCount: { $size: "$shipments" },
          usersCount: { $size: "$users" },
        },
      },
      { $sort: { "revenue.USD": -1, "revenue.SYP": -1 } },
    ]);

    const dailyRevenueData = await Transaction.aggregate([
      {
        $match: {
          type: "payment",
          status: "completed",
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $lookup: {
          from: "shipments",
          localField: "relatedShipment",
          foreignField: "_id",
          as: "shipment",
        },
      },
      { $unwind: { path: "$shipment", preserveNullAndEmptyArrays: true } },
      { $match: companyMatchWhenAdmin },
      {
        $project: {
          currency: 1,
          amount: 1,
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
      {
        $group: {
          _id: { date: "$date", currency: "$currency" },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          values: {
            $push: {
              currency: "$_id.currency",
              total: "$total",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          USD: {
            $reduce: {
              input: "$values",
              initialValue: 0,
              in: {
                $cond: [{ $eq: ["$$this.currency", "USD"] }, "$$this.total", "$$value"],
              },
            },
          },
          SYP: {
            $reduce: {
              input: "$values",
              initialValue: 0,
              in: {
                $cond: [{ $eq: ["$$this.currency", "SYP"] }, "$$this.total", "$$value"],
              },
            },
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    const pendingCancellationRequests = await Shipment.countDocuments({
      "cancellationRequest.isRequested": true,
      "cancellationRequest.status": "pending",
      ...(isCompanyAdmin ? { "shippingCompany.id": companyId } : {}),
    });

    const pendingEditRequests = await Shipment.countDocuments({
      "editRequest.isRequested": true,
      "editRequest.status": "pending",
      ...(isCompanyAdmin ? { "shippingCompany.id": companyId } : {}),
    });

    let companiesSummary = {
      total: 0,
      active: 0,
      items: [],
    };

    if (!isCompanyAdmin) {
      const companies = await ShippingCompany.find().lean();
      const shippingCounts = await Shipment.aggregate([
        {
          $group: {
            _id: "$shippingCompany.id",
            shipmentsCount: { $sum: 1 },
          },
        },
      ]);
      const userCounts = await User.aggregate([
        {
          $match: {
            shippingCompanyId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: { $toString: "$shippingCompanyId" },
            usersCount: { $sum: 1 },
          },
        },
      ]);

      const shippingCountsMap = shippingCounts.reduce((map, item) => {
        map[item._id] = item.shipmentsCount;
        return map;
      }, {});

      const userCountsMap = userCounts.reduce((map, item) => {
        map[item._id] = item.usersCount;
        return map;
      }, {});

      companiesSummary = {
        total: companies.length,
        active: companies.filter((company) => company.isActive).length,
        items: companies.map((company) => ({
          _id: company._id,
          name: company.name,
          code: company.code,
          usersCount: userCountsMap[company._id.toString()] || 0,
          shipmentsCount: shippingCountsMap[company._id.toString()] || 0,
        })),
      };
    }

    // Recent activities
    const recentActivities = await ActivityLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        currentCompany: currentCompany
          ? {
              id: currentCompany._id,
              name: currentCompany.name,
              code: currentCompany.code,
            }
          : null,
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
        },
        shipments: {
          total: totalShipments,
          pending: pendingShipments,
          inTransit: inTransitShipments,
          delivered: deliveredShipments,
          new: newShipments,
        },
        revenue,
        withdrawalRequests: {
          pending: withdrawalRequestsData.reduce(
            (sum, item) => sum + (item.count || 0),
            0,
          ),
          pendingAmountUSD:
            withdrawalRequestsData.find((item) => item._id === "USD")?.total ||
            0,
          pendingAmountSYP:
            withdrawalRequestsData.find((item) => item._id === "SYP")?.total ||
            0,
        },
        requestCounts: {
          editRequests: pendingEditRequests,
          cancellationRequests: pendingCancellationRequests,
        },
        companies: companiesSummary,
        companyRevenue: companyRevenueData,
        dailyRevenue: dailyRevenueData,
        recentActivities,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// @desc    Get all shipping companies
// @route   GET /api/admin/companies
// @access  Private/Admin
exports.getAllCompanies = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (req.user?.role === "company-admin") {
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
      query._id = req.user.shippingCompanyId;
    }

    const companies = await ShippingCompany.find(query)
      .populate("ownerUserId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ShippingCompany.countDocuments(query);

    res.json({
      success: true,
      data: companies,
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
      message: "Error fetching companies",
      error: error.message,
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
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
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      businessType,
      companyName,
      commercialRegistrationNumber,
      isActive,
      role,
      shippingCompanyId,
      balance,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldProfile = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      businessType: user.businessType,
      companyName: user.companyName,
      commercialRegistrationNumber: user.commercialRegistrationNumber,
      isActive: user.isActive,
      role: user.role,
      shippingCompanyId: user.shippingCompanyId,
      balance: user.balance,
    };

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (businessType !== undefined) user.businessType = businessType;
    if (companyName !== undefined) user.companyName = companyName;
    if (commercialRegistrationNumber !== undefined)
      user.commercialRegistrationNumber = commercialRegistrationNumber;
    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    if (shippingCompanyId !== undefined) user.shippingCompanyId = shippingCompanyId;
    if (balance) {
      if (balance.USD !== undefined) user.balance.USD = balance.USD;
      if (balance.SYP !== undefined) user.balance.SYP = balance.SYP;
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "admin-action",
      category: "admin",
      description: `Admin updated user ${user.email}`,
      targetId: user._id,
      targetModel: "User",
      metadata: {
        oldProfile,
        newProfile: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          businessType: user.businessType,
          companyName: user.companyName,
          commercialRegistrationNumber: user.commercialRegistrationNumber,
          isActive: user.isActive,
          role: user.role,
          shippingCompanyId: user.shippingCompanyId,
          balance: user.balance,
        },
      },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "admin-action",
      category: "admin",
      description: `Admin deleted user ${user.email}`,
      targetId: user._id,
      targetModel: "User",
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Get all shipments (admin)
// @route   GET /api/admin/shipments
// @access  Private/Admin
exports.getAllShipments = async (req, res) => {
  try {
    const {
      status,
      search,
      companyId,
      companyName,
      senderName,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = [];

    if (status) filters.push({ status });

    if (search) {
      filters.push({
        $or: [
          { trackingNumber: { $regex: search, $options: "i" } },
          { "sender.name": { $regex: search, $options: "i" } },
          { "receivers.0.name": { $regex: search, $options: "i" } },
        ],
      });
    }

    if (senderName) {
      filters.push({
        "sender.name": { $regex: senderName, $options: "i" },
      });
    }

    if (req.user.role === "company-admin") {
      if (req.user.shippingCompanyId) {
        filters.push({
          "shippingCompany.id": req.user.shippingCompanyId.toString(),
        });
      }
    } else {
      if (companyId) {
        const normalizedCompanyId = String(companyId).trim();
        if (normalizedCompanyId) {
          filters.push({ "shippingCompany.id": normalizedCompanyId });
        }
      }
      if (companyName) {
        filters.push({
          "shippingCompany.name": { $regex: String(companyName), $options: "i" },
        });
      }
    }

    if (startDate || endDate) {
      const dateRange = {};
      if (startDate) {
        const parsed = new Date(String(startDate));
        if (!Number.isNaN(parsed.getTime())) {
          dateRange.$gte = parsed;
        }
      }
      if (endDate) {
        const parsed = new Date(String(endDate));
        if (!Number.isNaN(parsed.getTime())) {
          parsed.setHours(23, 59, 59, 999);
          dateRange.$lte = parsed;
        }
      }
      if (Object.keys(dateRange).length) {
        filters.push({ createdAt: dateRange });
      }
    }

    const query = filters.length > 0 ? { $and: filters } : {};

    const shipments = await Shipment.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const count = await Shipment.countDocuments(query);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
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

// @desc    Get cancellation requests
// @route   GET /api/admin/cancellation-requests
// @access  Private/Admin/CompanyAdmin
exports.getCancellationRequests = async (req, res) => {
  try {
    const { status = "pending", search, companyId, page = 1, limit = 10 } = req.query;

    const query = {
      "cancellationRequest.status":
        status === "all"
          ? { $in: ["pending", "approved", "rejected"] }
          : status,
      "cancellationRequest.isRequested": true,
    };

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
    } else if (companyId) {
      query["shippingCompany.id"] = String(companyId);
    }

    if (search) {
      const userMatches = await User.find(
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        },
        "_id",
      );

      const userIds = userMatches.map((user) => user._id);

      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "receivers.0.name": { $regex: search, $options: "i" } },
        { "cancellationRequest.reason": { $regex: search, $options: "i" } },
      ];

      if (userIds.length > 0) {
        query.$or.push({ userId: { $in: userIds } });
      }
    }

    const shipments = await Shipment.find(query)
      .populate("userId", "name email phone")
      .sort({ "cancellationRequest.requestedAt": -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Shipment.countDocuments(query);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cancellation requests",
      error: error.message,
    });
  }
};

// @desc    Review cancellation request
// @route   PUT /api/admin/shipments/:id/cancellation-request
// @access  Private/Admin/CompanyAdmin
exports.reviewCancellationRequest = async (req, res) => {
  try {
    const { action, note } = req.body || {};

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (
      req.user.role === "company-admin" &&
      (!req.user.shippingCompanyId ||
        shipment.shippingCompany?.id !== req.user.shippingCompanyId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review this request",
      });
    }

    if (shipment.cancellationRequest?.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending cancellation request for this shipment",
      });
    }

    shipment.cancellationRequest.status =
      action === "approve" ? "approved" : "rejected";
    shipment.cancellationRequest.reviewNote = String(note || "").trim();
    shipment.cancellationRequest.reviewedBy = req.user.id;
    shipment.cancellationRequest.reviewedAt = new Date();

    if (action === "approve") {
      shipment.status = "cancelled";
      shipment.statusHistory.push({
        status: "cancelled",
        note: `Cancellation request approved${shipment.cancellationRequest.reviewNote ? `: ${shipment.cancellationRequest.reviewNote}` : ""}`,
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
    } else {
      shipment.statusHistory.push({
        status: shipment.status,
        note: `Cancellation request rejected${shipment.cancellationRequest.reviewNote ? `: ${shipment.cancellationRequest.reviewNote}` : ""}`,
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
    }

    await shipment.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "review-cancellation-request",
      category: "shipment",
      description: `${action === "approve" ? "Approved" : "Rejected"} cancellation request for ${shipment.trackingNumber}`,
      targetId: shipment._id,
      targetModel: "Shipment",
      metadata: {
        action,
        note: shipment.cancellationRequest.reviewNote,
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user-room-${shipment.userId.toString()}`).emit(
        "cancellation-request-reviewed",
        {
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          action,
          note: shipment.cancellationRequest.reviewNote,
          status: shipment.cancellationRequest.status,
        },
      );
      io.to("admin-room").emit("cancellation-request-reviewed", {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        action,
      });
    }

    res.json({
      success: true,
      message:
        action === "approve"
          ? "Cancellation request approved"
          : "Cancellation request rejected",
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reviewing cancellation request",
      error: error.message,
    });
  }
};

// @desc    Get shipment edit requests
// @route   GET /api/admin/edit-requests
// @access  Private/Admin/CompanyAdmin
exports.getEditRequests = async (req, res) => {
  try {
    const { status = "pending", search, companyId, page = 1, limit = 10 } = req.query;

    const query = {
      "editRequest.status":
        status === "all"
          ? { $in: ["pending", "approved", "rejected"] }
          : status,
      "editRequest.isRequested": true,
    };

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
    } else if (companyId) {
      query["shippingCompany.id"] = String(companyId);
    }

    if (search) {
      const userMatches = await User.find(
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        },
        "_id",
      );

      const userIds = userMatches.map((user) => user._id);

      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "receivers.0.name": { $regex: search, $options: "i" } },
        { "editRequest.requestedChanges": { $regex: search, $options: "i" } },
      ];

      if (userIds.length > 0) {
        query.$or.push({ userId: { $in: userIds } });
      }
    }

    const shipments = await Shipment.find(query)
      .populate("userId", "name email phone")
      .sort({ "editRequest.requestedAt": -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Shipment.countDocuments(query);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching edit requests",
      error: error.message,
    });
  }
};

// @desc    Review shipment edit request
// @route   PUT /api/admin/shipments/:id/edit-request
// @access  Private/Admin/CompanyAdmin
exports.reviewEditRequest = async (req, res) => {
  try {
    const { action, note, shipmentUpdates } = req.body || {};

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (
      req.user.role === "company-admin" &&
      (!req.user.shippingCompanyId ||
        shipment.shippingCompany?.id !== req.user.shippingCompanyId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review this request",
      });
    }

    if (shipment.editRequest?.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending edit request for this shipment",
      });
    }

    const originalCostAmount = Number(shipment.cost?.amount || 0);
    const originalPaymentMethod = String(
      shipment.cost?.paymentMethod || "wallet",
    ).trim().toLowerCase();
    const originalCostCurrency = String(
      shipment.cost?.currency ||
        (shipment.shippingType === "international" ? "USD" : "SYP"),
    ).toUpperCase();

    shipment.editRequest.status =
      action === "approve" ? "approved" : "rejected";
    shipment.editRequest.reviewNote = String(note || "").trim();
    shipment.editRequest.reviewedBy = req.user.id;
    shipment.editRequest.reviewedAt = new Date();

    const { sanitizedUpdates, rejectedKeys } =
      pickEditableShipmentUpdates(shipmentUpdates);
    const appliedUpdateFields = Object.keys(sanitizedUpdates);

    if (action === "approve" && appliedUpdateFields.length) {
      const mergedUpdates = mergeEditableShipmentUpdates(
        shipment,
        sanitizedUpdates,
      );

      appliedUpdateFields.forEach((field) => {
        if (typeof mergedUpdates[field] === "undefined") return;
        shipment.set(field, mergedUpdates[field]);
      });

      if (
        appliedUpdateFields.includes("shippingMode") ||
        appliedUpdateFields.includes("package")
      ) {
        await recalculateShipmentCost(shipment);

        const newCostAmount = Number(shipment.cost?.amount || 0);
        const newPaymentMethod = String(
          shipment.cost?.paymentMethod || "wallet",
        ).trim().toLowerCase();
        const refundCurrency = String(
          shipment.cost?.currency ||
            (shipment.shippingType === "international" ? "USD" : "SYP"),
        ).toUpperCase();

        if (
          originalPaymentMethod === "wallet" &&
          newPaymentMethod === "wallet"
        ) {
          if (newCostAmount < originalCostAmount) {
            const refundAmount = Number(originalCostAmount - newCostAmount);
            if (refundAmount > 0) {
              const user = await User.findById(shipment.userId);
              if (!user) {
                return res.status(404).json({
                  success: false,
                  message: "User not found for this shipment",
                });
              }

              const balanceBefore = Number(user.balance?.[refundCurrency] || 0);
              const updatedUser = await User.findOneAndUpdate(
                {
                  _id: user._id,
                },
                {
                  $inc: { [`balance.${refundCurrency}`]: refundAmount },
                },
                { new: true, runValidators: true },
              );

              if (!updatedUser) {
                return res.status(500).json({
                  success: false,
                  message: "Unable to update wallet balance for refund",
                });
              }

              const balanceAfter = Number(
                updatedUser.balance?.[refundCurrency] || 0,
              );
              const normalizedBalance = {
                USD: Number(updatedUser.balance?.USD || 0),
                SYP: Number(updatedUser.balance?.SYP || 0),
              };

              await Transaction.create({
                userId: user._id,
                type: "refund",
                amount: refundAmount,
                currency: refundCurrency,
                status: "completed",
                method: "wallet",
                relatedShipment: shipment._id,
                description: `Refund for shipment ${shipment.trackingNumber} after edit request approval`,
                balanceBefore,
                balanceAfter,
                processedBy: req.user.id,
                processedAt: new Date(),
              });

              await createAndEmitNotification(req, {
                userId: user._id,
                type: "wallet",
                titleAr: "تم استرداد مبلغ من المحفظة",
                titleEn: "Wallet Refund Issued",
                messageAr: `تمت إعادة ${refundAmount} ${refundCurrency} إلى محفظتك بعد تعديل الشحنة ${shipment.trackingNumber}.`, 
                messageEn: `${refundAmount} ${refundCurrency} was refunded to your wallet after shipment edit approval for ${shipment.trackingNumber}.`, 
                metadata: {
                  shipmentId: shipment._id,
                  trackingNumber: shipment.trackingNumber,
                  amount: refundAmount,
                  currency: refundCurrency,
                  reason: "edit-request-cost-decrease",
                },
                updatedBalance: normalizedBalance,
              });
            }
          } else if (newCostAmount > originalCostAmount) {
            const deductionAmount = Number(newCostAmount - originalCostAmount);
            const user = await User.findById(shipment.userId);
            if (!user) {
              return res.status(404).json({
                success: false,
                message: "User not found for this shipment",
              });
            }

            const userBalance = Number(user.balance?.[refundCurrency] || 0);
            if (userBalance < deductionAmount) {
              return res.status(400).json({
                success: false,
                message:
                  "Insufficient wallet balance to apply the updated shipment amount after adding packaging or other service.",
              });
            }

            const balanceBefore = userBalance;
            const updatedUser = await User.findOneAndUpdate(
              {
                _id: user._id,
                [`balance.${refundCurrency}`]: { $gte: deductionAmount },
              },
              { $inc: { [`balance.${refundCurrency}`]: -deductionAmount } },
              { new: true, runValidators: true },
            );

            if (!updatedUser) {
              return res.status(500).json({
                success: false,
                message: "Unable to update wallet balance for the shipment user.",
              });
            }

            const balanceAfter = Number(
              updatedUser.balance?.[refundCurrency] || 0,
            );
            const normalizedBalance = {
              USD: Number(updatedUser.balance?.USD || 0),
              SYP: Number(updatedUser.balance?.SYP || 0),
            };

            await Transaction.create({
              userId: user._id,
              type: "payment",
              amount: deductionAmount,
              currency: refundCurrency,
              status: "completed",
              method: "wallet",
              relatedShipment: shipment._id,
              description: `Additional deduction for shipment ${shipment.trackingNumber} after edit request approval`,
              balanceBefore,
              balanceAfter,
              processedBy: req.user.id,
              processedAt: new Date(),
            });

            await createAndEmitNotification(req, {
              userId: user._id,
              type: "wallet",
              titleAr: "تم خصم مبلغ إضافي من المحفظة",
              titleEn: "Additional Wallet Deduction",
              messageAr: `تم خصم ${deductionAmount} ${refundCurrency} من محفظتك بعد تحديث الشحنة ${shipment.trackingNumber}.`, 
              messageEn: `${deductionAmount} ${refundCurrency} was deducted from your wallet after shipment edit approval for ${shipment.trackingNumber}.`, 
              metadata: {
                shipmentId: shipment._id,
                trackingNumber: shipment.trackingNumber,
                amount: deductionAmount,
                currency: refundCurrency,
                reason: "edit-request-cost-increase",
              },
              updatedBalance: normalizedBalance,
            });

            shipment.cost.isPaid = true;
          }
        }
      }
    }

    shipment.statusHistory.push({
      status: shipment.status,
      note: `Shipment edit request ${action === "approve" ? "approved" : "rejected"}${appliedUpdateFields.length ? ` | Updated: ${appliedUpdateFields.join(", ")}` : ""}${shipment.editRequest.reviewNote ? ` | ${shipment.editRequest.reviewNote}` : ""}`,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    await shipment.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "review-edit-request",
      category: "shipment",
      description: `${action === "approve" ? "Approved" : "Rejected"} edit request for ${shipment.trackingNumber}`,
      targetId: shipment._id,
      targetModel: "Shipment",
      metadata: {
        action,
        note: shipment.editRequest.reviewNote,
        appliedUpdateFields,
        ignoredUpdateFields: rejectedKeys,
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user-room-${shipment.userId.toString()}`).emit(
        "edit-request-reviewed",
        {
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          action,
          note: shipment.editRequest.reviewNote,
          status: shipment.editRequest.status,
          appliedUpdateFields,
        },
      );
      io.to("admin-room").emit("edit-request-reviewed", {
        shipmentId: shipment._id,
        trackingNumber: shipment.trackingNumber,
        action,
      });
    }

    try {
      await createAndEmitNotification(req, {
        userId: shipment.userId,
        type: "shipment",
        titleAr:
          action === "approve"
            ? "تمت الموافقة على طلب تعديل الشحنة"
            : "تم رفض طلب تعديل الشحنة",
        titleEn:
          action === "approve"
            ? "Shipment Edit Request Approved"
            : "Shipment Edit Request Rejected",
        messageAr:
          action === "approve"
            ? `تمت الموافقة على طلب تعديل الشحنة ${shipment.trackingNumber}${appliedUpdateFields.length ? ` وتم تحديث: ${appliedUpdateFields.join(", ")}` : ""}.`
            : `تم رفض طلب تعديل الشحنة ${shipment.trackingNumber}.${shipment.editRequest.reviewNote ? ` السبب: ${shipment.editRequest.reviewNote}` : ""}`,
        messageEn:
          action === "approve"
            ? `Your shipment edit request for ${shipment.trackingNumber} was approved${appliedUpdateFields.length ? ` and updated: ${appliedUpdateFields.join(", ")}` : ""}.`
            : `Your shipment edit request for ${shipment.trackingNumber} was rejected.${shipment.editRequest.reviewNote ? ` Reason: ${shipment.editRequest.reviewNote}` : ""}`,
        metadata: {
          shipmentId: shipment._id,
          trackingNumber: shipment.trackingNumber,
          requestType: "edit",
          requestStatus: shipment.editRequest.status,
          action,
          appliedUpdateFields,
          reviewNote: shipment.editRequest.reviewNote,
        },
      });
    } catch (notificationError) {
      console.error("reviewEditRequest notification error:", notificationError);
    }

    res.json({
      success: true,
      message:
        action === "approve"
          ? "Edit request approved"
          : "Edit request rejected",
      appliedUpdateFields,
      ignoredUpdateFields: rejectedKeys,
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error reviewing edit request: ${error.message}`,
      error: error.message,
    });
  }
};

// @desc    Update shipment status
// @route   PUT /api/admin/shipments/:id/status
// @access  Private/Admin
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { status, note, location, shippingMode, packagingRequested, paymentMethod, correctedWeight, weightAdjustmentNote } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // منطق سير الحالات المطلوب
    const statusOrder = [
      "pending",
      "confirmed",
      "picked-up",
      "in-transit",
      "out-for-delivery",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(shipment.status);
    const newIndex = statusOrder.indexOf(status);

    // لا يمكن التعديل إذا كانت الشحنة تم تسليمها
    if (shipment.status === "delivered") {
      return res.status(403).json({
        success: false,
        message: "لا يمكن تعديل الشحنة بعد أن تم تسليمها للمستلم.",
      });
    }

    const weightChanged =
      typeof correctedWeight !== "undefined" &&
      correctedWeight !== null &&
      Number(correctedWeight) !== Number(shipment.package?.weight || 0);

    // إذا بقيت نفس الحالة، اسمح فقط إذا غيّر المستخدم الوزن أو خياراً آخر متعلقاً بالتكلفة
    if (shipment.status === status) {
      const willRecalcCost =
        weightChanged ||
        shippingMode ||
        typeof packagingRequested !== "undefined" ||
        paymentMethod;

      if (!willRecalcCost) {
        return res.status(400).json({
          success: false,
          message:
            "لا يمكن اختيار نفس حالة الشحنة الحالية دون إجراء أي تغيير على الوزن أو خيارات الشحن.",
        });
      }
    }

    // لا يمكن اختيار cancelled يدوياً
    if (status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "لا يمكن اختيار حالة ملغية إلا عند الموافقة على طلب إلغاء الشحنة.",
      });
    }

    // لا يمكن الرجوع للخلف في الحالات (يجب التقدم للأمام فقط)
    if (newIndex < currentIndex) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن الرجوع إلى حالة سابقة.",
      });
    }

    // تحديث الحالة
    shipment.status = status;
    shipment.statusHistory.push({
      status,
      note,
      location,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    // Handle corrected weight (weight adjustment) if provided
    if (typeof correctedWeight !== "undefined" && correctedWeight !== null) {
      const newWeight = Number(correctedWeight);
      if (Number.isNaN(newWeight) || newWeight <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid corrected weight",
        });
      }

      const originalWeight = shipment.package?.weight || 0;
      if (Math.abs(originalWeight - newWeight) > 0.0001) {
        shipment.weightAdjustment = {
          ...(shipment.weightAdjustment || {}),
          isAdjusted: true,
          originalWeight: originalWeight,
          correctedWeight: newWeight,
          note: String(weightAdjustmentNote || "").trim(),
          adjustedBy: req.user.id,
          adjustedAt: new Date(),
          balanceDeduction: {
            ...(shipment.weightAdjustment?.balanceDeduction || {}),
            required: false,
            amount: 0,
            currency: shipment.cost?.currency || "",
            status:
              shipment.weightAdjustment?.balanceDeduction?.status ||
              "not-required",
            note: shipment.weightAdjustment?.balanceDeduction?.note || "",
          },
        };

        // Update package weight to the corrected value so subsequent recalculation uses it
        shipment.package = {
          ...(shipment.package || {}),
          weight: newWeight,
        };
      }
    }

    // Allow updating shipment options: shippingMode (standard|express), packagingRequested, paymentMethod (wallet|cod), correctedWeight
    const shouldRecalcCost =
      weightChanged ||
      shippingMode ||
      typeof packagingRequested !== "undefined" ||
      paymentMethod;
    if (shouldRecalcCost) {
        const ShippingCompany = require("../models/ShippingCompany");
        const shippingCompany = await ShippingCompany.findById(shipment.shippingCompany?.id);
        if (!shippingCompany) {
          return res.status(400).json({ success: false, message: "Associated shipping company not found" });
        }

        // Validate express support
        const newShippingMode = shippingMode || shipment.shippingMode || "standard";
        if (newShippingMode === "express" && !shippingCompany.expressService?.enabled) {
          return res.status(400).json({ success: false, message: "Selected company does not support express shipping" });
        }

        // Validate packaging
        const newPackagingRequested = typeof packagingRequested !== "undefined" ? Boolean(packagingRequested) : (shipment.package?.packagingRequested || false);
        if (newPackagingRequested && !shippingCompany.packagingService?.enabled) {
          return res.status(400).json({ success: false, message: "Selected company does not support packaging service" });
        }

        // Validate payment method (cod)
        const newPaymentMethod = paymentMethod || shipment.cost?.paymentMethod || "wallet";
        if (newPaymentMethod === "cod" && !shippingCompany.codService?.enabled) {
          return res.status(400).json({ success: false, message: "Selected company does not support cash on delivery" });
        }

        // Recalculate costs similar to createShipment
        const Shipment = require("../models/Shipment");
        const length = shipment.package?.length || 0;
        const width = shipment.package?.width || 0;
        const height = shipment.package?.height || 0;
        const actualWeight = shipment.package?.weight || 0;
        const volumetricDivisor = shipment.cost?.volumetricDivisor || shippingCompany.volumetricDivisor || 6000;
        const volumetricWeight = length && width && height ? (length * width * height) / volumetricDivisor : 0;
        const billingWeight = Math.max(actualWeight, volumetricWeight);
        const firstReceiverCountry = shipment.receivers?.[0]?.country;
        const resolveInternationalPerKgRate = require("./shipmentController").resolveInternationalPerKgRate;
        const internationalRate = resolveInternationalPerKgRate(shippingCompany, firstReceiverCountry, billingWeight);
        const pricePerKg = shipment.shippingType === "international" ? internationalRate.rate : Number(shippingCompany.pricing?.localPerKgSYP || 0);

        const originalCostAmount = Number(shipment.cost?.amount || 0);
        const originalPaymentMethod = String(shipment.cost?.paymentMethod || "wallet").trim().toLowerCase();
        const originalCurrency = shipment.cost?.currency || (shipment.shippingType === "international" ? "USD" : "SYP");

        // Try to resolve an offer if exists
        const resolveShipmentOffer = require("./shipmentController").resolveShipmentOffer;
        const selectedOffer = resolveShipmentOffer(shippingCompany, shipment.offerId);

        const baseAmount = selectedOffer
          ? Number(
              shipment.shippingType === "international"
                ? (selectedOffer.internationalPriceUSD ?? selectedOffer.internationalPrice ?? 0)
                : (selectedOffer.localPriceSYP ?? selectedOffer.localPrice ?? 0),
            )
          : billingWeight * pricePerKg;

        const codFee = newPaymentMethod === "cod"
          ? Number(
              selectedOffer
                ? shipment.shippingType === "international"
                  ? selectedOffer.codFeeUSD || 0
                  : (selectedOffer.codFeeSYP ?? selectedOffer.codFee ?? 0)
                : shipment.shippingType === "international"
                  ? shippingCompany.codService?.internationalFeeUSD || 0
                  : shippingCompany.codService?.localFeeSYP || 0,
            )
          : 0;

        const expressFee = newShippingMode === "express"
          ? Number(
              selectedOffer
                ? shipment.shippingType === "international"
                  ? selectedOffer.expressFeeUSD || 0
                  : selectedOffer.expressFeeSYP || 0
                : shipment.shippingType === "international"
                  ? shippingCompany.expressService?.internationalFeeUSD || 0
                  : shippingCompany.expressService?.localFeeSYP || 0,
            )
          : 0;

        const packagingFee = newPackagingRequested && shippingCompany.packagingService?.enabled
          ? Number(
              shipment.shippingType === "international"
                ? shippingCompany.packagingService?.internationalFeeUSD || 0
                : shippingCompany.packagingService?.localFeeSYP || 0,
            )
          : 0;

        const totalAmount = baseAmount + codFee + expressFee + packagingFee;
        const safeTotalAmount = Number(totalAmount || 0) < 0 ? 0 : Number(totalAmount || 0);
        const costCurrency = shipment.shippingType === "international" ? "USD" : "SYP";
        let additionalWalletDeduction = 0;

        if (newPaymentMethod === "wallet") {
          additionalWalletDeduction = safeTotalAmount;
          if (originalPaymentMethod === "wallet") {
            additionalWalletDeduction = safeTotalAmount - originalCostAmount;
          }
          additionalWalletDeduction = Number(additionalWalletDeduction || 0);
        }

        // Apply updates
        shipment.shippingMode = newShippingMode;
        shipment.package = {
          ...(shipment.package || {}),
          packagingRequested: newPackagingRequested,
        };
        shipment.cost = {
          ...(shipment.cost || {}),
          amount: safeTotalAmount,
          baseAmount,
          codFee,
          expressFee,
          packagingFee,
          currency: costCurrency,
          paymentMethod: newPaymentMethod,
          volumetricDivisor,
          volumetricWeight,
          actualWeight,
          billingWeight,
        };

        if (additionalWalletDeduction > 0) {
          const user = await User.findById(shipment.userId);
          if (!user) {
            return res.status(404).json({ success: false, message: "User not found for this shipment" });
          }

          const userBalance = Number(user.balance?.[costCurrency] || 0);
          if (userBalance < additionalWalletDeduction) {
            return res.status(400).json({
              success: false,
              message:
                "Insufficient wallet balance to apply the updated shipment amount after weight correction.",
            });
          }

          const balanceBefore = userBalance;
          const updatedUser = await User.findOneAndUpdate(
            {
              _id: user._id,
              [`balance.${costCurrency}`]: { $gte: additionalWalletDeduction },
            },
            { $inc: { [`balance.${costCurrency}`]: -additionalWalletDeduction } },
            { new: true, runValidators: true },
          );

          if (!updatedUser) {
            return res.status(500).json({
              success: false,
              message: "Unable to update wallet balance for the shipment user.",
            });
          }

          const balanceAfter = Number(updatedUser.balance?.[costCurrency] || 0);
          const normalizedBalance = {
            USD: Number(updatedUser.balance?.USD || 0),
            SYP: Number(updatedUser.balance?.SYP || 0),
          };

          await Transaction.create({
            userId: user._id,
            type: "payment",
            amount: additionalWalletDeduction,
            currency: costCurrency,
            status: "completed",
            method: "wallet",
            relatedShipment: shipment._id,
            description: `Additional deduction for shipment ${shipment.trackingNumber} after weight correction`,
            balanceBefore,
            balanceAfter,
            processedBy: req.user.id,
            processedAt: new Date(),
          });

          await createAndEmitNotification(req, {
            userId: user._id,
            type: "wallet",
            titleAr: "تم خصم قيمة جديدة بعد تصحيح الوزن",
            titleEn: "Additional Shipment Deduction",
            messageAr: `تم خصم ${additionalWalletDeduction} ${costCurrency} من محفظتك بعد تصحيح وزن الشحنة ${shipment.trackingNumber}.`,
            messageEn: `${additionalWalletDeduction} ${costCurrency} was deducted from your wallet after weight correction for shipment ${shipment.trackingNumber}.`,
            metadata: {
              shipmentId: shipment._id,
              trackingNumber: shipment.trackingNumber,
              amount: additionalWalletDeduction,
              currency: costCurrency,
              paymentMethod: "wallet",
              reason: "weight-correction",
            },
            updatedBalance: normalizedBalance,
          });

          shipment.cost.isPaid = true;
          if (shipment.weightAdjustment) {
            shipment.weightAdjustment.balanceDeduction = {
              required: true,
              amount: additionalWalletDeduction,
              currency: costCurrency,
              status: "deducted",
              note: "تم خصم الفرق بعد تصحيح الوزن.",
            };
          }
        }
      }

    // إذا تم تغيير الحالة إلى 'in-transit' من قبل أي مستخدم غير مالك المنصة، يتم رفض طلب الإلغاء تلقائيًا
    const isPlatformOwner =
      req.user.role === "super-admin" || req.user.role === "admin";
    if (
      status === "in-transit" &&
      !isPlatformOwner &&
      shipment.cancellationRequest &&
      shipment.cancellationRequest.status === "pending"
    ) {
      shipment.cancellationRequest.status = "rejected";
      shipment.cancellationRequest.reviewedBy = req.user.id;
      shipment.cancellationRequest.reviewedAt = new Date();
      shipment.cancellationRequest.reviewNote =
        "تم رفض طلب الإلغاء تلقائيًا بسبب تغيير حالة الشحنة إلى في الطريق.";
    }

    if (status === "delivered") {
      shipment.actualDelivery = new Date();
    }

    await shipment.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "admin-action",
      category: "admin",
      description: `Admin updated shipment ${shipment.trackingNumber} status to ${status}`,
      targetId: shipment._id,
      targetModel: "Shipment",
    });

    // Emit socket event to user (only to the specific user room)
    const io = req.app.get("io");
    io.to(`user-room-${shipment.userId}`).emit(
      `shipment-update-${shipment.userId}`,
      {
        shipment,
        status,
      },
    );

    res.json({
      success: true,
      message: "Shipment status updated successfully",
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating shipment status",
      error: error.message,
    });
  }
};

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      page = 1,
      limit = 10,
      scope,
      companyId: queryCompanyId,
      paymentMethod,
      currency,
      dateFrom,
      dateTo,
      shipmentStatus,
      search,
    } = req.query;

    // If requesting company-settlement scope, use aggregation to join shipments
    if (scope === "company-settlement") {
      // Determine allowed company scope: platform admins can pass companyId, others are restricted to their company
      const isPlatformOwner = req.user?.role === "admin" || req.user?.role === "super-admin";
      const allowedCompanyId = isPlatformOwner
        ? queryCompanyId || null
        : req.user?.shippingCompanyId || null;

      const match = {
        type: "payment",
        status: "completed",
      };
      if (paymentMethod) match.method = paymentMethod;
      if (currency && currency !== "all") match.currency = currency;
      if (dateFrom || dateTo) match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
      if (search) {
        match.$or = [
          { reference: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const aggregatePipeline = [
        { $match: match },
        {
          $lookup: {
            from: "shipments",
            localField: "relatedShipment",
            foreignField: "_id",
            as: "shipment",
          },
        },
        { $unwind: { path: "$shipment", preserveNullAndEmptyArrays: true } },
      ];

      if (allowedCompanyId) {
        aggregatePipeline.push({
          $match: { "shipment.shippingCompany.id": String(allowedCompanyId) },
        });
      }

      if (shipmentStatus) {
        aggregatePipeline.push({ $match: { "shipment.status": shipmentStatus } });
      }

      aggregatePipeline.push({ $sort: { createdAt: -1 } });
      aggregatePipeline.push({
        $group: {
          _id: "$shipment._id",
          doc: { $first: "$$ROOT" },
        },
      });
      aggregatePipeline.push({ $replaceRoot: { newRoot: "$doc" } });

      const facet = {
        $facet: {
          data: [{ $skip: (Number(page) - 1) * Number(limit) }, { $limit: Number(limit) }],
          totalCount: [{ $count: "count" }],
        },
      };

      aggregatePipeline.push(facet);

      const result = await Transaction.aggregate(aggregatePipeline).allowDiskUse(true);
      const data = (result[0]?.data || []).map((r) => ({
        _id: r._id,
        reference: r.reference,
        amount: r.amount,
        baseAmount: r.baseAmount,
        codFee: r.codFee,
        currency: r.currency,
        paymentMethod: r.method,
        shipmentStatus: r.shipment?.status,
        trackingNumber: r.shipment?.trackingNumber,
        createdAt: r.createdAt,
        userId: r.userId,
      }));

      const total = (result[0]?.totalCount[0]?.count) || 0;

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.max(1, Math.ceil(total / Number(limit))),
        },
      });
    }

    // Fallback: regular transactions listing
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (req.user?.role === "company-admin") {
      const companyId = req.user.shippingCompanyId?.toString();
      if (!companyId) {
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

      const result = await Transaction.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "shipments",
            localField: "relatedShipment",
            foreignField: "_id",
            as: "shipment",
          },
        },
        { $unwind: { path: "$shipment", preserveNullAndEmptyArrays: true } },
        { $match: { "shipment.shippingCompany.id": companyId } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [{ $skip: (Number(page) - 1) * Number(limit) }, { $limit: Number(limit) }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]).allowDiskUse(true);

      const data = (result[0]?.data || []).map((item) => ({
        ...item,
        userId: item.user || item.userId,
      }));
      const total = (result[0]?.totalCount[0]?.count) || 0;

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.max(1, Math.ceil(total / Number(limit))),
        },
      });
    }

    const transactions = await Transaction.find(query)
      .populate("userId", "name email phone")
      .populate("relatedShipment", "trackingNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
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
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

// @desc    Review withdrawal request
// @route   PUT /api/admin/transactions/:id/withdrawal-review
// @access  Private/Admin
exports.reviewWithdrawalRequest = async (req, res) => {
  try {
    const { action, note } = req.body || {};

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.type !== "withdrawal") {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found",
      });
    }

    if (transaction.status !== "pending") {
      if (transaction.status === "completed" && action === "approve") {
        return res.json({
          success: true,
          message: "Withdrawal request already approved",
          data: transaction,
        });
      }

      if (transaction.status === "cancelled" && action === "reject") {
        return res.json({
          success: true,
          message: "Withdrawal request already rejected",
          data: transaction,
        });
      }

      return res.status(400).json({
        success: false,
        message: `No pending withdrawal request to review. Current status: ${transaction.status}`,
      });
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found for this withdrawal request",
      });
    }

    const reviewNote = String(note || "").trim();
    const amount = Number(transaction.amount || 0);
    const currency = String(transaction.currency || "USD").toUpperCase();
    let updatedUser = null;

    if (action === "approve") {
      const currentBalance = Number(user.balance?.[currency] || 0);
      if (currentBalance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance to approve withdrawal request",
        });
      }

      updatedUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          [`balance.${currency}`]: { $gte: amount },
        },
        {
          $inc: { [`balance.${currency}`]: -amount },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Unable to update user balance for withdrawal approval",
        });
      }

      transaction.status = "completed";
      transaction.processedBy = req.user.id;
      transaction.processedAt = new Date();
      transaction.balanceBefore = currentBalance;
      transaction.balanceAfter = Number(updatedUser.balance?.[currency] || 0);
      transaction.description = `Approved by platform admin${reviewNote ? `: ${reviewNote}` : ""}`;
    } else {
      transaction.status = "cancelled";
      transaction.processedBy = req.user.id;
      transaction.processedAt = new Date();
      transaction.description = `Rejected by platform admin${reviewNote ? `: ${reviewNote}` : ""}`;
    }

    await transaction.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "review-withdrawal-request",
      category: "wallet",
      description: `${action === "approve" ? "Approved" : "Rejected"} withdrawal request ${transaction.reference}`,
      targetId: transaction._id,
      targetModel: "Transaction",
      metadata: {
        action,
        note: reviewNote,
        amount,
        currency,
      },
    });

    await createAndEmitNotification(req, {
      userId: user._id,
      type: "wallet",
      titleAr:
        action === "approve"
          ? "تم قبول طلب السحب"
          : "تم رفض طلب السحب",
      titleEn:
        action === "approve"
          ? "Withdrawal request approved"
          : "Withdrawal request rejected",
      messageAr:
        action === "approve"
          ? `تمت الموافقة على طلب سحب ${amount} ${currency}`
          : `تم رفض طلب سحب ${amount} ${currency}`,
      messageEn:
        action === "approve"
          ? `Your withdrawal request for ${amount} ${currency} has been approved by platform admin.`
          : `Your withdrawal request for ${amount} ${currency} has been rejected by platform admin.`,
      metadata: {
        transactionId: transaction._id,
        action,
        note: reviewNote,
        amount,
        currency,
      },
      updatedBalance:
        action === "approve"
          ? { [currency]: Number(updatedUser?.balance?.[currency] || 0) }
          : undefined,
    });

    const message =
      action === "approve"
        ? "Withdrawal request approved"
        : "Withdrawal request rejected";

    res.json({
      success: true,
      message,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reviewing withdrawal request",
      error: error.message,
    });
  }
};

const normalizeHeaderValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

const parseExcelNumber = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim().replace(/,/g, ".");
  const number = Number(str);
  return Number.isFinite(number) ? number : null;
};

const findShipmentForImport = async ({ trackingNumber, reference, companyId }) => {
  if (trackingNumber) {
    const query = {
      trackingNumber: String(trackingNumber || "").trim().toUpperCase(),
    };
    if (companyId) query["shippingCompany.id"] = String(companyId);

    const shipment = await Shipment.findOne(query);
    if (shipment) return shipment;
  }

  if (reference) {
    const transaction = await Transaction.findOne({
      reference: String(reference || "").trim(),
    }).populate("relatedShipment");

    if (transaction?.relatedShipment) {
      const shipment = transaction.relatedShipment;
      if (!companyId || String(shipment.shippingCompany?.id) === String(companyId)) {
        return shipment;
      }
    }
  }

  return null;
};

// @desc    Import comparison invoices from Excel
// @route   POST /api/admin/comparison-invoices/import
// @access  Private/Admin
exports.importComparisonInvoices = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    const companyId = req.body.companyId || req.user?.shippingCompanyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company scope is required",
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Excel file does not contain any worksheet",
      });
    }

    const headerRow = worksheet.getRow(1);
    const columnMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const key = normalizeHeaderValue(cell.value);
      if (!key) return;

      if (
        ["trackingnumber", "trackingnumber", "tracking", "shipmenttrackingnumber", "shipmenttracking", "trackingno", "trackingno"].includes(key)
      ) {
        columnMap.trackingNumber = colNumber;
      } else if (
        ["reference", "ref", "transactionreference", "transactionref", "invoice", "invoiceid"].includes(key)
      ) {
        columnMap.reference = colNumber;
      } else if (
        ["status", "shipmentstatus", "state", "currentstatus"].includes(key)
      ) {
        columnMap.status = colNumber;
      } else if (
        ["weight", "actualweight", "billingweight", "packageweight", "weightkg"].includes(key)
      ) {
        columnMap.weight = colNumber;
      }
    });

    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push(row);
    });

    const errors = [];
    const updates = [];
    let matched = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const rowNumber = row.number;
      const trackingValue = columnMap.trackingNumber
        ? row.getCell(columnMap.trackingNumber).value
        : null;
      const referenceValue = columnMap.reference
        ? row.getCell(columnMap.reference).value
        : null;
      const statusValue = columnMap.status
        ? row.getCell(columnMap.status).value
        : null;
      const weightValue = columnMap.weight
        ? row.getCell(columnMap.weight).value
        : null;

      const trackingNumber = String(trackingValue || "").trim();
      const reference = String(referenceValue || "").trim();
      const status = String(statusValue || "").trim();
      const weight = parseExcelNumber(weightValue);

      if (!trackingNumber && !reference) {
        errors.push({
          rowNumber,
          message: "Missing tracking number or reference",
        });
        skipped += 1;
        continue;
      }

      if (!status && weight === null) {
        errors.push({
          rowNumber,
          message: "Row does not contain a valid status or weight",
        });
        skipped += 1;
        continue;
      }

      const shipment = await findShipmentForImport({
        trackingNumber,
        reference,
        companyId,
      });

      if (!shipment) {
        errors.push({
          rowNumber,
          message: "Shipment not found in current scope",
        });
        skipped += 1;
        continue;
      }

      matched += 1;

      const currentStatus = String(shipment.status || "").trim();
      const previousWeight = Number(shipment.package?.weight || 0);
      const normalizedStatus = status ? String(status).trim() : "";
      const statusChanged = normalizedStatus
        ? normalizedStatus !== currentStatus
        : false;
      const weightChanged =
        weight !== null && Math.abs(weight - previousWeight) > 0.0001;

      if (statusChanged || weightChanged) {
        updated += 1;
      }

      updates.push({
        rowNumber,
        trackingNumber: trackingNumber || undefined,
        reference: reference || undefined,
        previousStatus: currentStatus,
        currentStatus: normalizedStatus || currentStatus,
        previousWeight,
        currentWeight: weight !== null ? weight : previousWeight,
        statusChanged,
        weightChanged,
      });
    }

    const result = {
      totalRows: rows.length,
      matched,
      updated,
      skipped,
      unchanged: Math.max(0, matched - updated),
      errors,
      updates,
    };

    return res.json({
      success: true,
      data: result,
      message: "Comparison invoice imported successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error importing comparison invoice",
      error: error.message,
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const { action, category, userId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (action) query.action = action;
    if (category) query.category = category;
    if (userId) query.userId = userId;

    const logs = await ActivityLog.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
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
      message: "Error fetching activity logs",
      error: error.message,
    });
  }
};

// @desc    Export data to Excel
// @route   GET /api/admin/export/excel
// @access  Private/Admin
exports.exportToExcel = async (req, res) => {
  try {
    const { type } = req.query;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      type === "users" ? "Users" : "Shipments",
    );

    if (type === "users") {
      const users = await User.find({ role: "user" });

      worksheet.columns = [
        { header: "ID", key: "id", width: 25 },
        { header: "Name", key: "name", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Balance USD", key: "balanceUSD", width: 15 },
        { header: "Balance SYP", key: "balanceSYP", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      users.forEach((user) => {
        worksheet.addRow({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          balanceUSD: user.balance.USD,
          balanceSYP: user.balance.SYP,
          status: user.isActive ? "Active" : "Inactive",
          createdAt: user.createdAt.toISOString(),
        });
      });
    } else if (type === "shipments") {
      const query = {};
      if (req.user?.role === "company-admin" && req.user?.shippingCompanyId) {
        query["shippingCompany.id"] = req.user.shippingCompanyId.toString();
      }

      const shipments = await Shipment.find(query).populate("userId", "name email");

      worksheet.columns = [
        { header: "Tracking Number", key: "trackingNumber", width: 20 },
        { header: "User", key: "user", width: 30 },
        { header: "From", key: "from", width: 25 },
        { header: "To", key: "to", width: 25 },
        { header: "Status", key: "status", width: 15 },
        { header: "Cost", key: "cost", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      shipments.forEach((shipment) => {
        const userName = shipment.userId ? shipment.userId.name || shipment.userId.email || "-" : "-";
        const senderCity = shipment.sender?.city || shipment.sender?.state || shipment.sender?.country || "-";
        const senderCountry = shipment.sender?.country || "-";
        const receiver = Array.isArray(shipment.receivers) && shipment.receivers.length > 0 ? shipment.receivers[0] : null;
        const receiverCity = receiver?.city || receiver?.state || receiver?.country || "-";
        const receiverCountry = receiver?.country || "-";
        const costText = (shipment.cost && shipment.cost.amount !== undefined)
          ? `${shipment.cost.amount} ${shipment.cost.currency || ""}`
          : "-";
        const createdAtText = shipment.createdAt ? new Date(shipment.createdAt).toISOString() : "-";

        worksheet.addRow({
          trackingNumber: shipment.trackingNumber,
          user: userName,
          from: `${senderCity}, ${senderCountry}`,
          to: `${receiverCity}, ${receiverCountry}`,
          status: shipment.status || "-",
          cost: costText,
          createdAt: createdAtText,
        });
      });
    } else if (type === "transactions") {
      // Export transactions with optional filters
      const {
        transactionType,
        status: txStatus,
        paymentMethod,
        currency,
        dateFrom,
        dateTo,
        search,
      } = req.query;

      const query = {};
      if (transactionType) query.type = transactionType;
      if (txStatus) query.status = txStatus;
      if (paymentMethod) query.method = paymentMethod;
      if (currency && currency !== "all") query.currency = currency;
      if (dateFrom || dateTo) query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
      if (search) {
        // search in reference or user email/name
        query.$or = [
          { reference: { $regex: search, $options: "i" } },
        ];
      }

      const companyAdminCompanyId =
        req.user?.role === "company-admin" && req.user?.shippingCompanyId
          ? req.user.shippingCompanyId.toString()
          : null;

      let transactions;
      if (companyAdminCompanyId) {
        transactions = await Transaction.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "shipments",
              localField: "relatedShipment",
              foreignField: "_id",
              as: "shipment",
            },
          },
          { $unwind: { path: "$shipment", preserveNullAndEmptyArrays: true } },
          { $match: { "shipment.shippingCompany.id": companyAdminCompanyId } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              type: 1,
              status: 1,
              amount: 1,
              currency: 1,
              method: 1,
              reference: 1,
              createdAt: 1,
              userId: { _id: "$user._id", name: "$user.name", email: "$user.email", phone: "$user.phone" },
              relatedShipment: {
                _id: "$shipment._id",
                trackingNumber: "$shipment.trackingNumber",
                shippingCompany: "$shipment.shippingCompany",
              },
            },
          },
          { $sort: { createdAt: -1 } },
        ]).allowDiskUse(true);
      } else {
        transactions = await Transaction.find(query)
          .populate("userId", "name email phone")
          .populate("relatedShipment", "trackingNumber shippingCompany")
          .sort({ createdAt: -1 });
      }

      worksheet.columns = [
        { header: "ID", key: "id", width: 25 },
        { header: "Type", key: "type", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Currency", key: "currency", width: 10 },
        { header: "Method", key: "method", width: 15 },
        { header: "Reference", key: "reference", width: 30 },
        { header: "User", key: "user", width: 30 },
        { header: "Shipment", key: "shipment", width: 20 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      transactions.forEach((tx) => {
        const userText = tx.userId ? tx.userId.name || tx.userId.email || "-" : "-";
        const shipmentText = tx.relatedShipment
          ? tx.relatedShipment.trackingNumber || "-"
          : "-";
        worksheet.addRow({
          id: tx._id.toString(),
          type: tx.type,
          status: tx.status,
          amount: tx.amount,
          currency: tx.currency,
          method: tx.method,
          reference: tx.reference || "",
          user: userText,
          shipment: shipmentText,
          createdAt: tx.createdAt ? tx.createdAt.toISOString() : "",
        });
      });
    } else if (type === "company-settlement") {
      // Export settlement transactions for a specific company or scope
      const {
        companyId,
        paymentMethod,
        currency,
        dateFrom,
        dateTo,
        shipmentStatus,
      } = req.query;

      const allowedCompanyId = companyId ||
        (req.user?.role !== "admin" && req.user?.role !== "super-admin"
          ? req.user?.shippingCompanyId
          : undefined);

      const match = {
        type: "payment",
        status: "completed",
      };
      if (paymentMethod) match.method = paymentMethod;
      if (currency && currency !== "all") match.currency = currency;
      if (dateFrom || dateTo) match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);

      // Aggregate transactions joined with shipments, filter by shipping company id if provided
      const settlementRows = await Transaction.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "shipments",
            localField: "relatedShipment",
            foreignField: "_id",
            as: "shipment",
          },
        },
        { $unwind: { path: "$shipment", preserveNullAndEmptyArrays: true } },
        allowedCompanyId
          ? { $match: { "shipment.shippingCompany.id": String(allowedCompanyId) } }
          : { $match: {} },
        shipmentStatus
          ? { $match: { "shipment.status": shipmentStatus } }
          : { $match: {} },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$shipment._id",
            reference: { $first: "$reference" },
            amount: { $first: "$amount" },
            currency: { $first: "$currency" },
            method: { $first: "$method" },
            createdAt: { $first: "$createdAt" },
            trackingNumber: { $first: "$shipment.trackingNumber" },
            companyId: { $first: "$shipment.shippingCompany.id" },
            companyName: { $first: "$shipment.shippingCompany.name" },
            shipmentStatus: { $first: "$shipment.status" },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      worksheet.columns = [
        { header: "Reference", key: "reference", width: 30 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Currency", key: "currency", width: 10 },
        { header: "Method", key: "method", width: 15 },
        { header: "Company", key: "company", width: 30 },
        { header: "Tracking", key: "tracking", width: 20 },
        { header: "Shipment Status", key: "shipmentStatus", width: 20 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      settlementRows.forEach((r) => {
        worksheet.addRow({
          reference: r.reference || "",
          amount: r.amount,
          currency: r.currency,
          method: r.method,
          company: r.companyName || r.companyId || "-",
          tracking: r.trackingNumber || "-",
          shipmentStatus: r.shipmentStatus || "-",
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        });
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting to Excel",
      error: error.message,
    });
  }
};
