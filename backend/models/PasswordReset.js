const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for automatic cleanup
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate reset token
passwordResetSchema.methods.generateToken = function () {
  const crypto = require("crypto");
  this.resetToken = crypto.randomBytes(32).toString("hex");
  // Token expires in 15 minutes
  this.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  return this.resetToken;
};

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
