const fs = require("fs");
const path = require("path");
const multer = require("multer");

const companyLogoDir = path.join(__dirname, "..", "uploads", "company-logos");
fs.mkdirSync(companyLogoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, companyLogoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".png";
    cb(
      null,
      `company-logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`,
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

const companyLogoUpload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("logo");

const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    const extension = path.extname(file.originalname || "").toLowerCase();
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      [".xlsx", ".xls"].includes(extension)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).single("file");

module.exports = {
  companyLogoUpload,
  excelUpload,
};
