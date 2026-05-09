const fs = require("fs");
const path = require("path");
const multer = require("multer");

const packageImagesDir = path.join(
  __dirname,
  "..",
  "uploads",
  "package-images",
);
fs.mkdirSync(packageImagesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, packageImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".png";
    cb(
      null,
      `package-image-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`,
    );
  },
});

const imageOnlyFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const packageImageUpload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single("packageImage");

module.exports = {
  packageImageUpload,
};
