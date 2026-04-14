const mongoose = require("mongoose");

const PHONE_REGEX = /^\+?\d{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shippingCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingCompany",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      validate: {
        validator: (value) => PHONE_REGEX.test(String(value || "")),
        message:
          "Phone number is invalid. Use digits only with optional leading +",
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) =>
          !value || EMAIL_REGEX.test(String(value || "").trim()),
        message: "Email format is invalid",
      },
    },
    address: {
      type: String,
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    clientType: {
      type: String,
      enum: ["individual", "merchant"],
      required: true,
      default: "individual",
    },
    companyName: {
      type: String,
      trim: true,
    },
    commercialRegister: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["sender", "receiver", "both"],
      required: true,
      default: "both",
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });
contactSchema.index({ shippingCompanyId: 1, createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);
