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
  "shippingType",
  "sender",
  "receivers",
  "package",
  "notes",
  "estimatedDelivery",
  "actualDelivery",
]);

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const sanitizeNestedObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      isPlainObject(item) ? sanitizeNestedObject(item) : item,
    );
  }

  if (!isPlainObject(value)) return value;

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (["__proto__", "prototype", "constructor"].includes(key)) return;
    next[key] = sanitizeNestedObject(nestedValue);
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
    sanitizedUpdates[key] = sanitizeNestedObject(value);
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

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

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
    const totalShipments = await Shipment.countDocuments();
    const pendingShipments = await Shipment.countDocuments({
      status: "pending",
    });
    const inTransitShipments = await Shipment.countDocuments({
      status: "in-transit",
    });
    const deliveredShipments = await Shipment.countDocuments({
      status: "delivered",
    });
    const newShipments = await Shipment.countDocuments({
      createdAt: { $gte: daysAgo },
    });

    // Revenue stats
    const revenueData = await Transaction.aggregate([
      {
        $match: {
          type: "payment",
          status: "completed",
          createdAt: { $gte: daysAgo },
        },
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

    // Recent activities
    const recentActivities = await ActivityLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
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
    const { isActive, role, balance } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
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
      metadata: { changes: req.body },
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
    const { status = "pending", search, page = 1, limit = 10 } = req.query;

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
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "receivers.0.name": { $regex: search, $options: "i" } },
      ];
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
    const { status = "pending", search, page = 1, limit = 10 } = req.query;

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
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "receivers.0.name": { $regex: search, $options: "i" } },
        { "editRequest.requestedChanges": { $regex: search, $options: "i" } },
      ];
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
    const { status, note, location } = req.body;
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

    // لا يمكن اختيار نفس الحالة الحالية
    if (shipment.status === status) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن اختيار نفس حالة الشحنة الحالية.",
      });
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
    const { type, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

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
      const shipments = await Shipment.find().populate("userId", "name email");

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
        worksheet.addRow({
          trackingNumber: shipment.trackingNumber,
          user: shipment.userId.name,
          from: `${shipment.sender.city}, ${shipment.sender.country}`,
          to: `${shipment.receiver.city}, ${shipment.receiver.country}`,
          status: shipment.status,
          cost: `${shipment.cost.amount} ${shipment.cost.currency}`,
          createdAt: shipment.createdAt.toISOString(),
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
