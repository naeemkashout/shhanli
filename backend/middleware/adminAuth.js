const { protect, authorize } = require("./auth");

// Admin authentication middleware
exports.adminAuth = [protect, authorize("admin", "super-admin")];

// Super admin only middleware
exports.superAdminAuth = [protect, authorize("super-admin")];
