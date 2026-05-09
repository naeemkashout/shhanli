require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: "admin" }).lean();
    if (!admin) {
      throw new Error("No admin user found");
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("admin", admin.email, "token", token);
    const apiBase = process.env.VITE_API_URL || "http://localhost:5002/api";
    const response = await axios.get(`${apiBase}/admin/shipments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { companyId: "69d4bea9f10460af27cd5313", limit: 5 },
    });
    console.log("status", response.status);
    console.log("total", response.data.pagination.total);
    console.log(
      response.data.data.map((s) => ({
        id: s._id,
        companyId: s.shippingCompany.id,
        companyName: s.shippingCompany.name,
      })),
    );
  } catch (err) {
    console.error(err.response?.data || err.message || err);
  } finally {
    await mongoose.disconnect();
  }
})();
