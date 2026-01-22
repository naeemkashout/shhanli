const mongoose = require("mongoose");
require("dotenv").config();

async function showUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const users = await mongoose.connection.db
      .collection("users")
      .find(
        {},
        {
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
          isVerified: 1,
          createdAt: 1,
          _id: 0,
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    if (users.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    console.log("\n📋 Users Table:");
    console.log("=".repeat(100));
    console.log(
      "Name".padEnd(20),
      "Email".padEnd(30),
      "Phone".padEnd(15),
      "Role".padEnd(10),
      "Verified".padEnd(10),
      "Created",
    );
    console.log("=".repeat(100));

    users.forEach((user) => {
      const verified = user.isVerified ? "✅" : "❌";
      const created = new Date(user.createdAt).toLocaleDateString("ar-SY");
      console.log(
        (user.name || "N/A").padEnd(20),
        (user.email || "N/A").padEnd(30),
        (user.phone || "N/A").padEnd(15),
        (user.role || "user").padEnd(10),
        verified.padEnd(10),
        created,
      );
    });

    console.log("=".repeat(100));
    console.log(`\n📊 Total Users: ${users.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

showUsers();
