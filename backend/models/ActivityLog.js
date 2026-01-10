const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "register",
        "create-shipment",
        "update-shipment",
        "cancel-shipment",
        "deposit",
        "withdrawal",
        "payment",
        "update-profile",
        "change-password",
        "admin-action",
        "system-action",
      ],
    },
    category: {
      type: String,
      enum: ["auth", "shipment", "wallet", "profile", "admin", "system"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["success", "failed", "warning"],
      default: "success",
    },
    targetId: mongoose.Schema.Types.ObjectId,
    targetModel: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
