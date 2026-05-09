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
    offers: {
      type: [
        {
          title: { type: String, trim: true, default: "" },
          titleEn: { type: String, trim: true, default: "" },
          subtitle: { type: String, trim: true, default: "" },
          subtitleEn: { type: String, trim: true, default: "" },
          description: { type: String, trim: true, default: "" },
          descriptionEn: { type: String, trim: true, default: "" },
          imageUrl: { type: String, trim: true, default: "" },
          ctaText: { type: String, trim: true, default: "" },
          ctaTextEn: { type: String, trim: true, default: "" },
          ctaLink: { type: String, trim: true, default: "" },
          background: { type: String, trim: true, default: "" },
          localPrice: { type: Number, default: 0 },
          internationalPrice: { type: Number, default: 0 },
          codFee: { type: Number, default: 0 },
          localPriceSYP: { type: Number, default: 0 },
          localPriceUSD: { type: Number, default: 0 },
          internationalPriceSYP: { type: Number, default: 0 },
          internationalPriceUSD: { type: Number, default: 0 },
          codFeeSYP: { type: Number, default: 0 },
          codFeeUSD: { type: Number, default: 0 },
          expressFeeSYP: { type: Number, default: 0 },
          expressFeeUSD: { type: Number, default: 0 },
          packagingFeeSYP: { type: Number, default: 0 },
          packagingFeeUSD: { type: Number, default: 0 },
          durationDays: { type: Number, default: 0 },
          durationHours: { type: Number, default: 0 },
          priority: { type: Number, default: 0 },
          isActive: { type: Boolean, default: true },
          startAt: { type: Date, default: null },
          endAt: { type: Date, default: null },
        },
      ],
      default: [],
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
    internationalZoneRates: {
      type: [
        {
          zone: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
          },
          minWeight: {
            type: Number,
            default: 0,
            min: 0,
          },
          maxWeight: {
            type: Number,
            default: 0,
            min: 0,
          },
          perKgUSD: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
      default: [],
    },
    internationalCountryZones: {
      type: Map,
      of: String,
      default: {},
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
    expressService: {
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
    packagingService: {
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
