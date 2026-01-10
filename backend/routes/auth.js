const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  register,
  login,
  getMe,
  logout,
  refreshToken,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);

module.exports = router;
