require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ShippingCompany = require('./models/ShippingCompany');

async function updateUserToCompanyAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'admin@company.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.name);

    // Create a shipping company for this user
    const company = await ShippingCompany.create({
      name: 'My Test Shipping Company',
      code: 'MYTEST',
      email: 'admin@company.com',
      phone: '+963987654321',
      address: 'Damascus, Syria',
      description: 'Test shipping company for development',
      supportsLocal: true,
      supportsInternational: true,
      pricing: {
        localPerKgSYP: 5000,
        internationalPerKgUSD: 5,
      },
      volumetricDivisor: 6000,
      isActive: true,
      ownerUserId: user._id,
    });

    console.log('Created shipping company:', company.name);

    // Update user to company-admin
    user.role = 'company-admin';
    user.shippingCompanyId = company._id;
    await user.save();

    console.log('Updated user role to company-admin');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserToCompanyAdmin();