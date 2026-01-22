const express = require("express");
const router = express.Router();
const {
  getUserContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactById,
} = require("../controllers/contactController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Routes
router.route("/").get(getUserContacts).post(createContact);

router
  .route("/:id")
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

module.exports = router;
