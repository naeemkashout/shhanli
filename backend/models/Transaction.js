const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "payment", "refund", "fee", "commission"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["USD", "SYP"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    method: {
      type: String,
      enum: ["wallet", "cash", "card", "bank-transfer", "mobile-payment"],
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },
    relatedShipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
    },
    description: {
      type: String,
      default: "",
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Map,
      of: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Generate reference number
transactionSchema.pre("save", async function (next) {
  if (!this.reference) {
    const prefix = "TXN";
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    this.reference = `${prefix}${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
