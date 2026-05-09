require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admins = await User.find({ role: { $in: ["admin", "super-admin"] } })
      .select("email role isActive shippingCompanyId")
      .lean();
    console.log(JSON.stringify(admins, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
