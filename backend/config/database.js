const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // User indexes
    const User = mongoose.model("User");
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { unique: true });

    // Shipment indexes
    const Shipment = mongoose.model("Shipment");
    await Shipment.collection.createIndex(
      { trackingNumber: 1 },
      { unique: true }
    );
    await Shipment.collection.createIndex({ userId: 1 });
    await Shipment.collection.createIndex({ status: 1 });

    console.log("✅ Database indexes created");
  } catch (error) {
    console.log("ℹ️  Indexes will be created when models are loaded");
  }
};

module.exports = connectDB;
