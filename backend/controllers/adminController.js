const User = require("../models/User");
const Shipment = require("../models/Shipment");
const Transaction = require("../models/Transaction");
const ActivityLog = require("../models/ActivityLog");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Users stats
    const totalUsers = await User.countDocuments({ role: "user" });
    const newUsers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: daysAgo },
    });
    const activeUsers = await User.countDocuments({
      role: "user",
      isActive: true,
    });

    // Shipments stats
    const totalShipments = await Shipment.countDocuments();
    const pendingShipments = await Shipment.countDocuments({
      status: "pending",
    });
    const inTransitShipments = await Shipment.countDocuments({
      status: "in-transit",
    });
    const deliveredShipments = await Shipment.countDocuments({
      status: "delivered",
    });
    const newShipments = await Shipment.countDocuments({
      createdAt: { $gte: daysAgo },
    });

    // Revenue stats
    const revenueData = await Transaction.aggregate([
      {
        $match: {
          type: "payment",
          status: "completed",
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const revenue = {
      USD: revenueData.find((r) => r._id === "USD")?.total || 0,
      SYP: revenueData.find((r) => r._id === "SYP")?.total || 0,
    };

    // Recent activities
    const recentActivities = await ActivityLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
        },
        shipments: {
          total: totalShipments,
          pending: pendingShipments,
          inTransit: inTransitShipments,
          delivered: deliveredShipments,
          new: newShipments,
        },
        revenue,
        recentActivities,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { isActive, role, balance } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    if (balance) {
      if (balance.USD !== undefined) user.balance.USD = balance.USD;
      if (balance.SYP !== undefined) user.balance.SYP = balance.SYP;
    }

    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "admin-action",
      category: "admin",
      description: `Admin updated user ${user.email}`,
      targetId: user._id,
      targetModel: "User",
      metadata: { changes: req.body },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "admin-action",
      category: "admin",
      description: `Admin deleted user ${user.email}`,
      targetId: user._id,
      targetModel: "User",
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Get all shipments (admin)
// @route   GET /api/admin/shipments
// @access  Private/Admin
exports.getAllShipments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "receiver.name": { $regex: search, $options: "i" } },
      ];
    }

    const shipments = await Shipment.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Shipment.countDocuments(query);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shipments",
      error: error.message,
    });
  }
};

// @desc    Update shipment status
// @route   PUT /api/admin/shipments/:id/status
// @access  Private/Admin
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { status, note, location } = req.body;

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    shipment.status = status;
    shipment.statusHistory.push({
      status,
      note,
      location,
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    if (status === "delivered") {
      shipment.actualDelivery = new Date();
    }

    await shipment.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "admin-action",
      category: "admin",
      description: `Admin updated shipment ${shipment.trackingNumber} status to ${status}`,
      targetId: shipment._id,
      targetModel: "Shipment",
    });

    // Emit socket event to user
    const io = req.app.get("io");
    io.emit(`shipment-update-${shipment.userId}`, {
      shipment,
      status,
    });

    res.json({
      success: true,
      message: "Shipment status updated successfully",
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating shipment status",
      error: error.message,
    });
  }
};

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate("userId", "name email phone")
      .populate("relatedShipment", "trackingNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const { action, category, userId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (action) query.action = action;
    if (category) query.category = category;
    if (userId) query.userId = userId;

    const logs = await ActivityLog.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching activity logs",
      error: error.message,
    });
  }
};

// @desc    Export data to Excel
// @route   GET /api/admin/export/excel
// @access  Private/Admin
exports.exportToExcel = async (req, res) => {
  try {
    const { type } = req.query;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      type === "users" ? "Users" : "Shipments"
    );

    if (type === "users") {
      const users = await User.find({ role: "user" });

      worksheet.columns = [
        { header: "ID", key: "id", width: 25 },
        { header: "Name", key: "name", width: 30 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Balance USD", key: "balanceUSD", width: 15 },
        { header: "Balance SYP", key: "balanceSYP", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      users.forEach((user) => {
        worksheet.addRow({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          balanceUSD: user.balance.USD,
          balanceSYP: user.balance.SYP,
          status: user.isActive ? "Active" : "Inactive",
          createdAt: user.createdAt.toISOString(),
        });
      });
    } else if (type === "shipments") {
      const shipments = await Shipment.find().populate("userId", "name email");

      worksheet.columns = [
        { header: "Tracking Number", key: "trackingNumber", width: 20 },
        { header: "User", key: "user", width: 30 },
        { header: "From", key: "from", width: 25 },
        { header: "To", key: "to", width: 25 },
        { header: "Status", key: "status", width: 15 },
        { header: "Cost", key: "cost", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      shipments.forEach((shipment) => {
        worksheet.addRow({
          trackingNumber: shipment.trackingNumber,
          user: shipment.userId.name,
          from: `${shipment.sender.city}, ${shipment.sender.country}`,
          to: `${shipment.receiver.city}, ${shipment.receiver.country}`,
          status: shipment.status,
          cost: `${shipment.cost.amount} ${shipment.cost.currency}`,
          createdAt: shipment.createdAt.toISOString(),
        });
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting to Excel",
      error: error.message,
    });
  }
};
