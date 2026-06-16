const Notification = require("../models/Notification");
const User = require("../models/User");
const fcmService = require("../services/fcmService");

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 20 } = req.query;
    const query = { userId: req.user.id };

    if (status === "unread") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 20)
      .skip(((Number(page) || 1) - 1) * (Number(limit) || 20));

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: count,
        pages: Math.ceil(count / (Number(limit) || 20)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: error.message,
    });
  }
};

// @desc    Register device FCM token for current user
// @route   POST /api/notifications/device-token
// @access  Private
exports.registerDeviceToken = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.fcmTokens = Array.from(new Set([...(user.fcmTokens || []), token]));
    await user.save();

    res.json({ success: true, message: "Device token registered" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error registering device token", error: error.message });
  }
};

// Helper for other controllers
exports.createAndEmitNotification = async (req, payload) => {
  const notification = await Notification.create(payload);
  const io = req.app.get("io");

  if (io && typeof io.to === "function") {
    io.to(`user-room-${String(payload.userId)}`).emit(
      "new-notification",
      notification,
    );

    if (payload.type === "wallet") {
      io.to(`user-room-${String(payload.userId)}`).emit("wallet-updated", {
        notificationId: notification._id,
        metadata: payload.metadata || {},
        balance: payload.updatedBalance || undefined,
      });
    }
  }

  // Send push notification via FCM if possible
  try {
    // Prefer explicit tokens provided in payload
    let tokens = Array.isArray(payload.fcmTokens) ? payload.fcmTokens : [];

    if ((!tokens || tokens.length === 0) && payload.userId) {
      const user = await User.findById(payload.userId).select("fcmTokens");
      tokens = (user && Array.isArray(user.fcmTokens)) ? user.fcmTokens : [];
    }

    if (tokens && tokens.length > 0) {
      const title = payload.titleEn || payload.title || "";
      const body = payload.messageEn || payload.message || "";
      const data = payload.metadata || {};
      await fcmService.sendToTokens(tokens, { title, body, data });
    }
  } catch (err) {
    console.error("Error sending FCM notification:", err.message);
  }

  return notification;
};
