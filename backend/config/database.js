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
    console.log("⚠️  Server will continue without database connection");
    // process.exit(1); // Commented out to allow server to run without DB
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
      { unique: true },
    );
    await Shipment.collection.createIndex({ userId: 1 });
    await Shipment.collection.createIndex({ status: 1 });

    // Contact indexes
    const Contact = mongoose.model("Contact");
    await Contact.collection.createIndex(
      { userId: 1, phone: 1 },
      { unique: true },
    );
    await Contact.collection.createIndex({ userId: 1 });

    console.log("✅ Database indexes created");
  } catch (error) {
    console.log("ℹ️  Indexes will be created when models are loaded");
  }
};

module.exports = connectDB;
