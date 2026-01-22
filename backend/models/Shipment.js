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
    shippingType: {
      type: String,
      enum: ["local", "international"],
      required: true,
      default: "local",
    },
    sender: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String },
      street: { type: String, required: true },
      country: { type: String, required: true },
      state: { type: String, required: true },
      city: { type: String, required: true },
      clientType: {
        type: String,
        enum: ["individual", "merchant"],
        required: true,
      },
      companyName: { type: String },
      commercialRegister: { type: String },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    receivers: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        address: { type: String },
        street: { type: String, required: true },
        country: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
    ],
    package: {
      type: {
        type: String,
        enum: [
          "documents",
          "electronics",
          "clothing",
          "books",
          "gifts",
          "food",
          "other",
        ],
        required: true,
      },
      weight: { type: Number, required: true },
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      description: { type: String, required: true },
      value: { type: Number, required: true },
      currency: { type: String, enum: ["USD", "SYP"], required: true },
      fragile: { type: Boolean, default: false },
    },
    shippingCompany: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    cost: {
      amount: { type: Number, required: true },
      currency: { type: String, enum: ["USD", "SYP"], required: true },
      paymentMethod: {
        type: String,
        enum: ["wallet", "cod"],
        required: true,
      },
      isPaid: { type: Boolean, default: false },
      volumetricWeight: { type: Number },
      actualWeight: { type: Number },
      billingWeight: { type: Number },
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
        status: { type: String, required: true },
        note: { type: String },
        location: { type: String },
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
    documents: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
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
