const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      businessType,
      companyName,
      commercialRegistrationNumber,
    } = req.body;

    const user = await User.findById(req.user.id);
    const oldProfile = {
      name: user.name,
      phone: user.phone,
      address: user.address,
      businessType: user.businessType,
      companyName: user.companyName,
      commercialRegistrationNumber: user.commercialRegistrationNumber,
    };

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (businessType !== undefined) user.businessType = businessType;
    if (companyName !== undefined) user.companyName = companyName;
    if (commercialRegistrationNumber !== undefined)
      user.commercialRegistrationNumber = commercialRegistrationNumber;

    await user.save();

    // Log activity with previous profile snapshot
    await ActivityLog.create({
      userId: user._id,
      action: "update-profile",
      category: "profile",
      description: "User updated profile",
      metadata: {
        oldProfile,
        newProfile: {
          name: user.name,
          phone: user.phone,
          address: user.address,
          businessType: user.businessType,
          companyName: user.companyName,
          commercialRegistrationNumber: user.commercialRegistrationNumber,
        },
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: "change-password",
      category: "profile",
      description: "User changed password",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};
