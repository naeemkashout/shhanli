const Contact = require("../models/Contact");
const ActivityLog = require("../models/ActivityLog");

const isPlatformAdmin = (user) => ["admin", "super-admin"].includes(user.role);
const isCompanyAdmin = (user) => user.role === "company-admin";

const canAccessContact = (contact, user) => {
  if (isPlatformAdmin(user)) return true;

  if (isCompanyAdmin(user)) {
    return (
      user.shippingCompanyId &&
      contact.shippingCompanyId &&
      contact.shippingCompanyId.toString() === user.shippingCompanyId.toString()
    );
  }

  return contact.userId.toString() === user.id;
};

const normalizeContactPayload = (payload = {}) => {
  const next = { ...payload };

  const trimFields = [
    "name",
    "phone",
    "email",
    "address",
    "street",
    "country",
    "state",
    "city",
    "companyName",
    "commercialRegister",
  ];

  trimFields.forEach((field) => {
    if (typeof next[field] === "string") {
      next[field] = next[field].trim();
    }
  });

  if (typeof next.phone === "string") {
    next.phone = next.phone.replace(/\s+/g, "");
  }

  if (typeof next.email === "string") {
    next.email = next.email.toLowerCase();
    if (!next.email) {
      delete next.email;
    }
  }

  return next;
};

// @desc    Get user contacts
// @route   GET /api/contacts
// @access  Private
exports.getUserContacts = async (req, res) => {
  try {
    const { search, type, clientType, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };

    if (isCompanyAdmin(req.user)) {
      if (!req.user.shippingCompanyId) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }

      query.shippingCompanyId = req.user.shippingCompanyId;
    } else if (!isPlatformAdmin(req.user)) {
      query.userId = req.user.id;
    }

    // Add filters
    if (type && type !== "all") {
      query.type = type;
    }
    if (clientType && clientType !== "all") {
      query.clientType = clientType;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get user contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contacts",
      error: error.message,
    });
  }
};

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res) => {
  try {
    const contactData = {
      ...normalizeContactPayload(req.body),
      userId: req.user.id,
      shippingCompanyId: req.user.shippingCompanyId || null,
    };

    const contact = await Contact.create(contactData);

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "create-contact",
      category: "profile",
      description: `Created contact: ${contact.name}`,
      targetId: contact._id,
      targetModel: "Contact",
    });

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create contact error:", error);

    // Handle duplicate phone number
    if (error.code === 11000 && error.keyPattern?.phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;
      return res.status(400).json({
        success: false,
        message: firstMessage || "Invalid contact data",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating contact",
      error: error.message,
    });
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Check ownership
    if (!canAccessContact(contact, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this contact",
      });
    }

    const updateData = normalizeContactPayload(req.body);

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "update-contact",
      category: "profile",
      description: `Updated contact: ${updatedContact.name}`,
      targetId: updatedContact._id,
      targetModel: "Contact",
    });

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: updatedContact,
    });
  } catch (error) {
    console.error("Update contact error:", error);

    // Handle duplicate phone number
    if (error.code === 11000 && error.keyPattern?.phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;
      return res.status(400).json({
        success: false,
        message: firstMessage || "Invalid contact data",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating contact",
      error: error.message,
    });
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Check ownership
    if (!canAccessContact(contact, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this contact",
      });
    }

    // Soft delete by setting isActive to false
    await Contact.findByIdAndUpdate(req.params.id, { isActive: false });

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "delete-contact",
      category: "profile",
      description: `Deleted contact: ${contact.name}`,
      targetId: contact._id,
      targetModel: "Contact",
    });

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting contact",
      error: error.message,
    });
  }
};

// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Check ownership
    if (!canAccessContact(contact, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this contact",
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Get contact by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contact",
      error: error.message,
    });
  }
};
