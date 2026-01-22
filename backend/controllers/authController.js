const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const ActivityLog = require("../models/ActivityLog");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../config/email");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      businessType,
      companyName,
      commercialRegister,
      address,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or phone",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      businessType: businessType || "individual",
      companyName,
      commercialRegistrationNumber: commercialRegister,
      address,
    });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: "register",
      category: "auth",
      description: `User registered: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        errorType: "MISSING_CREDENTIALS",
      });
    }

    // Check for user (include password field) - email is stored in lowercase
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email not found. Please check your email address or sign up.",
        errorType: "USER_NOT_FOUND",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
        errorType: "ACCOUNT_DEACTIVATED",
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
        errorType: "INVALID_PASSWORD",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: "login",
      category: "auth",
      description: `User logged in: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
      error: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = undefined;
    await req.user.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "logout",
      category: "auth",
      description: `User logged out: ${req.user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging out",
      error: error.message,
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        errorType: "MISSING_EMAIL",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please check your email address.",
        errorType: "USER_NOT_FOUND",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
        errorType: "ACCOUNT_DEACTIVATED",
      });
    }

    // Check if there's already an active reset token for this user
    const existingReset = await PasswordReset.findOne({
      userId: user._id,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingReset) {
      return res.status(429).json({
        success: false,
        message:
          "A password reset link has already been sent. Please check your email or try again later.",
        errorType: "RESET_ALREADY_SENT",
      });
    }

    // Create password reset token
    const passwordReset = new PasswordReset({
      userId: user._id,
      email: user.email,
    });

    const resetToken = passwordReset.generateToken();
    await passwordReset.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);

      // Log activity
      await ActivityLog.create({
        userId: user._id,
        action: "password-reset-request",
        category: "auth",
        description: `Password reset requested for: ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({
        success: true,
        message:
          "Password reset link has been sent to your email. Please check your inbox.",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Delete the reset token if email failed
      await PasswordReset.findByIdAndDelete(passwordReset._id);

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
        errorType: "EMAIL_SEND_FAILED",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
      error: error.message,
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
        errorType: "MISSING_DATA",
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
        errorType: "INVALID_PASSWORD",
      });
    }

    // Find and validate reset token
    const passwordReset = await PasswordReset.findOne({
      resetToken: token,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate("userId");

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token. Please request a new password reset.",
        errorType: "INVALID_TOKEN",
      });
    }

    // Update user password
    const user = passwordReset.userId;
    user.password = newPassword;
    await user.save();

    // Mark reset token as used
    passwordReset.used = true;
    await passwordReset.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: "password-reset",
      category: "auth",
      description: `Password reset completed for: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};
