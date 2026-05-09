require("dotenv").config();
const mongoose = require("mongoose");
const Shipment = require("./models/Shipment");
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const sample = await Shipment.find()
      .limit(3)
      .select("shippingCompany")
      .lean();
    console.log("sample", JSON.stringify(sample, null, 2));
    const companyIds = [...new Set(sample.map((s) => s.shippingCompany.id))];
    for (const id of companyIds) {
      const count = await Shipment.countDocuments({ "shippingCompany.id": id });
      console.log("count", id, count);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
