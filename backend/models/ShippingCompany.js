const mongoose = require("mongoose");

const shippingCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Company code is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    trackingUrlTemplate: {
      type: String,
      trim: true,
      default: "",
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    supportsLocal: {
      type: Boolean,
      default: true,
    },
    supportsInternational: {
      type: Boolean,
      default: true,
    },
    supportedCountries: {
      type: [String],
      default: [],
    },
    supportedLocalStates: {
      type: [String],
      default: [],
    },
    pricing: {
      localPerKgSYP: {
        type: Number,
        default: 0,
      },
      internationalPerKgUSD: {
        type: Number,
        default: 0,
      },
    },
    volumetricDivisor: {
      type: Number,
      default: 6000,
      min: 1,
    },
    codService: {
      enabled: {
        type: Boolean,
        default: false,
      },
      localFeeSYP: {
        type: Number,
        default: 0,
      },
      internationalFeeUSD: {
        type: Number,
        default: 0,
      },
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

shippingCompanySchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model("ShippingCompany", shippingCompanySchema);
