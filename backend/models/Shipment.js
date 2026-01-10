const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
    },
    receiver: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
    },
    package: {
      type: {
        type: String,
        enum: ["document", "parcel", "package"],
        required: true,
      },
      weight: { type: Number, required: true },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      description: String,
      value: Number,
      quantity: { type: Number, default: 1 },
    },
    service: {
      type: {
        type: String,
        enum: ["standard", "express", "overnight"],
        required: true,
      },
      deliveryTime: String,
    },
    cost: {
      amount: { type: Number, required: true },
      currency: { type: String, enum: ["USD", "SYP"], required: true },
      paymentMethod: {
        type: String,
        enum: ["wallet", "cash", "card"],
        required: true,
      },
      isPaid: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "picked-up",
        "in-transit",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        note: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      date: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate tracking number
shipmentSchema.pre("save", async function (next) {
  if (!this.trackingNumber) {
    const prefix = "KSH";
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.trackingNumber = `${prefix}${timestamp}${random}`;
  }
  next();
});

// Add status to history when status changes
shipmentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("Shipment", shipmentSchema);
