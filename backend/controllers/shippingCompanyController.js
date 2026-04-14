const ShippingCompany = require("../models/ShippingCompany");

// @desc    Get active shipping companies
// @route   GET /api/shipping-companies
// @access  Public
exports.getShippingCompanies = async (req, res) => {
  try {
    const { shippingType } = req.query;
    const query = { isActive: true };

    if (shippingType === "local") {
      query.supportsLocal = true;
    }

    if (shippingType === "international") {
      query.supportsInternational = true;
    }

    const companies = await ShippingCompany.find(query)
      .select(
        "name code email phone address description logoUrl trackingUrlTemplate supportsLocal supportsInternational supportedCountries supportedLocalStates pricing volumetricDivisor codService isActive"
      )
      .sort({ name: 1 });

    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shipping companies",
      error: error.message,
    });
  }
};