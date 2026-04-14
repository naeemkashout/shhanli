const { protect, authorize } = require("./auth");

// Admin authentication middleware
exports.adminAuth = [protect, authorize("admin", "super-admin")];

// Platform admin or company admin middleware
exports.managementAuth = [
	protect,
	authorize("admin", "super-admin", "company-admin"),
];

// Company admin only middleware
exports.companyAdminAuth = [protect, authorize("company-admin")];

// Super admin only middleware
exports.superAdminAuth = [protect, authorize("super-admin")];
