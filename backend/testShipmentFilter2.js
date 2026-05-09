require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: "admin" }).lean();
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const apiBase = process.env.VITE_API_URL || "http://localhost:5002/api";
    const tests = [
      { params: { search: "KSH394307L", limit: 5 }, name: "tracking search" },
      { params: { status: "pending", limit: 5 }, name: "status pending" },
      {
        params: { startDate: "2026-05-01", endDate: "2026-05-05", limit: 5 },
        name: "date range",
      },
    ];
    for (const test of tests) {
      const res = await axios.get(`${apiBase}/admin/shipments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: test.params,
      });
      console.log(
        test.name,
        "total",
        res.data.pagination.total,
        "returned",
        res.data.data.length,
      );
    }
  } catch (err) {
    console.error(err.response?.data || err.message || err);
  } finally {
    await mongoose.disconnect();
  }
})();
