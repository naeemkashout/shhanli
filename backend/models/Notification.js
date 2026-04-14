const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["shipment", "wallet", "system"],
      default: "system",
    },
    titleAr: {
      type: String,
      required: true,
      trim: true,
    },
    titleEn: {
      type: String,
      required: true,
      trim: true,
    },
    messageAr: {
      type: String,
      required: true,
      trim: true,
    },
    messageEn: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
