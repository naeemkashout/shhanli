const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const ShippingCompany = require("./models/ShippingCompany");

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    // Create a shipping company
    const company = await ShippingCompany.create({
      name: "Test Shipping Company",
      code: "TEST",
      email: "test@company.com",
      phone: "+963123456789",
      address: "Damascus, Syria",
      description: "Test shipping company for development",
      supportsLocal: true,
      supportsInternational: true,
      pricing: {
        localPerKgSYP: 5000,
        internationalPerKgUSD: 5,
      },
      volumetricDivisor: 6000,
      isActive: true,
    });

    console.log("Created shipping company:", company.name);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    // Create company-admin user
    const user = await User.create({
      name: "Company Admin",
      email: "test@company.com",
      phone: "+963123456789",
      password: hashedPassword,
      role: "company-admin",
      shippingCompanyId: company._id,
      isActive: true,
      isVerified: true,
    });

    // Update company with owner
    await ShippingCompany.findByIdAndUpdate(company._id, {
      ownerUserId: user._id,
    });

    console.log("Created company-admin user:", user.email);
    console.log("Password: 123456");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestData();
