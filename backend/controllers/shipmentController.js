const Shipment = require("../models/Shipment");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private
exports.createShipment = async (req, res) => {
  try {
    const shipmentData = {
      ...req.body,
      userId: req.user.id,
    };

    const shipment = await Shipment.create(shipmentData);

    // Deduct cost from wallet if payment method is wallet
    if (shipment.cost.paymentMethod === "wallet") {
      const user = await User.findById(req.user.id);
      const currency = shipment.cost.currency;

      if (user.balance[currency] < shipment.cost.amount) {
        await Shipment.findByIdAndDelete(shipment._id);
        return res.status(400).json({
          success: false,
          message: "Insufficient balance",
        });
      }

      const balanceBefore = user.balance[currency];
      user.balance[currency] -= shipment.cost.amount;
      await user.save();

      // Create transaction record
      await Transaction.create({
        userId: req.user.id,
        type: "payment",
        amount: shipment.cost.amount,
        currency: currency,
        status: "completed",
        method: "wallet",
        relatedShipment: shipment._id,
        description: `Payment for shipment ${shipment.trackingNumber}`,
        balanceBefore,
        balanceAfter: user.balance[currency],
        processedAt: new Date(),
      });

      shipment.cost.isPaid = true;
      await shipment.save();
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
    io.to("admin-room").emit("new-shipment", {
      shipment,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: shipment,
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating shipment",
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

    const query = { userId: req.user.id };
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
      "name email phone"
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
      !["admin", "super-admin"].includes(req.user.role)
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
        receiver: shipment.receiver,
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
    if (["delivered", "cancelled"].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this shipment",
      });
    }

    shipment.status = "cancelled";
    await shipment.save();

    // Refund if paid
    if (shipment.cost.isPaid && shipment.cost.paymentMethod === "wallet") {
      const user = await User.findById(req.user.id);
      const currency = shipment.cost.currency;
      const balanceBefore = user.balance[currency];

      user.balance[currency] += shipment.cost.amount;
      await user.save();

      await Transaction.create({
        userId: req.user.id,
        type: "refund",
        amount: shipment.cost.amount,
        currency: currency,
        status: "completed",
        method: "wallet",
        relatedShipment: shipment._id,
        description: `Refund for cancelled shipment ${shipment.trackingNumber}`,
        balanceBefore,
        balanceAfter: user.balance[currency],
        processedAt: new Date(),
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "cancel-shipment",
      category: "shipment",
      description: `Cancelled shipment ${shipment.trackingNumber}`,
      targetId: shipment._id,
      targetModel: "Shipment",
    });

    res.json({
      success: true,
      message: "Shipment cancelled successfully",
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
