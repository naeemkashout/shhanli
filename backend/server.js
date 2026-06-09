const dns = require('dns');
dns.setServers(["1.1.1.1", "8.8.8.8"]); // استخدام سيرفرات Cloudflare و Google لتخطي حجب الـ ISP للـ SRV

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/User");
const path = require("path");

// Load environment variables
dotenv.config({ path: "./.env" });

const getCorsOrigins = () => {
  const devDefaults = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://10.0.2.2:5173",
    "http://10.0.2.2:5174",
    "http://10.0.2.2:5175",
    "http://10.0.3.2:5173",
    "http://10.0.3.2:5174",
    "http://10.0.3.2:5175",
  ];

  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const frontendUrl = String(process.env.FRONTEND_URL || "").trim();

  return Array.from(
    new Set([
      ...devDefaults,
      ...configuredOrigins,
      ...(frontendUrl ? [frontendUrl] : []),
    ]),
  );
};

const getNormalizedMongoUri = () => {
  if (!process.env.MONGODB_URI) return "";
  return process.env.MONGODB_URI.replace(/[\r\n\t]/g, "").trim();
};

const getNormalizedFallbackMongoUri = () => {
  if (!process.env.MONGODB_URI_FALLBACK) return "";
  return process.env.MONGODB_URI_FALLBACK.replace(/[\r\n\t]/g, "").trim();
};

console.log("🔍 Environment variables loaded:");
console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI ? "✅ موجود" : "❌ غير موجود",
);
console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ? "✅ موجود" : "❌ غير موجود",
);

// Create Express app
const app = express();
const server = http.createServer(app);

// ⭐⭐⭐⭐ تكوين CORS ⭐⭐⭐⭐
const io = socketIo(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

// ⭐⭐⭐⭐ معالجة الأخطاء ⭐⭐⭐⭐
process.on("uncaughtException", (err) => {
  console.error("❌ خطأ غير متوقع:", err.message);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ وعد غير معالج:", reason);
});

// ⭐⭐⭐⭐ الاتصال بقاعدة البيانات - نسخة مصححة ⭐⭐⭐⭐
const connectDB = async () => {
  const connectWithUri = async (mongoUri, label) => {
    const safeUri = mongoUri.replace(/:[^:@]*@/, ":****@");
    console.log(`📡 محاولة الاتصال بـ (${label}):`, safeUri);

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    await mongoose.connect(mongoUri, options);
  };

  try {
    const mongoUri = getNormalizedMongoUri();
    const fallbackMongoUri = getNormalizedFallbackMongoUri();

    if (!mongoUri) {
      console.error("❌ MONGODB_URI غير موجود في ملف .env");
      return false;
    }

    if (mongoUri !== process.env.MONGODB_URI) {
      console.log("ℹ️ تم تنظيف قيمة MONGODB_URI من الفراغات/الأسطر الزائدة");
    }

    await connectWithUri(mongoUri, "primary");

    console.log("✅ MongoDB متصل بنجاح");

    // مراقبة حالة الاتصال
    mongoose.connection.on("error", (err) => {
      console.error("❌ خطأ في اتصال MongoDB:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ تم فصل اتصال MongoDB");
    });

    return true;
  } catch (error) {
    console.error("❌ فشل الاتصال بـ MongoDB:");
    console.error("   - السبب:", error.message);

    const fallbackMongoUri = getNormalizedFallbackMongoUri();

    if (fallbackMongoUri) {
      try {
        console.log("ℹ️ سنحاول الاتصال بـ MONGODB_URI_FALLBACK...");
        await connectWithUri(fallbackMongoUri, "fallback");
        console.log("✅ تم الاتصال بقاعدة البيانات البديلة بنجاح");

        mongoose.connection.on("error", (err) => {
          console.error("❌ خطأ في اتصال MongoDB:", err.message);
        });

        mongoose.connection.on("disconnected", () => {
          console.log("⚠️ تم فصل اتصال MongoDB");
        });

        return true;
      } catch (fallbackError) {
        console.error("❌ فشل الاتصال بقاعدة البيانات البديلة:");
        console.error("   - السبب:", fallbackError.message);
      }
    }

    if (error.message.includes("ENOTFOUND")) {
      console.error("   💡 الحل: رابط MongoDB غير صحيح أو لا يمكن الوصول إليه");
      console.error("   💡 تحقق من:");
      console.error("      1. الرابط في ملف .env");
      console.error("      2. اتصال الإنترنت");
      console.error(
        "      3. إذا كنت تستخدم MongoDB Atlas، تأكد من إضافة IP الخاص بك",
      );
    }

    return false;
  }
};

const ensureAdminUser = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();

    if (!adminEmail || !adminPassword) {
      console.log(
        "ℹ️ تم تجاوز إنشاء حساب الإدارة (ADMIN_EMAIL/ADMIN_PASSWORD غير موجودين)",
      );
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (
        existingAdmin.role !== "admin" &&
        existingAdmin.role !== "super-admin"
      ) {
        existingAdmin.role = "admin";
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log("✅ تم تحديث صلاحية حساب الإدارة الموجود");
      }
      return;
    }

    const fallbackPhone = (process.env.ADMIN_PHONE || "0999999999").trim();
    const emailLocal = adminEmail.split("@")[0] || "Admin";

    let adminPhone = fallbackPhone;
    const phoneExists = await User.findOne({ phone: adminPhone });
    if (phoneExists) {
      adminPhone = `09${Date.now().toString().slice(-8)}`;
    }

    await User.create({
      name: process.env.ADMIN_NAME || `Admin ${emailLocal}`,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: "admin",
      isActive: true,
      isVerified: true,
      businessType: "individual",
    });

    console.log("✅ تم إنشاء حساب الإدارة الافتراضي بنجاح");
  } catch (error) {
    console.error("❌ فشل إنشاء حساب الإدارة الافتراضي:", error.message);
  }
};

// ⭐⭐⭐⭐ Middleware ⭐⭐⭐⭐
app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.set("io", io);

// ⭐⭐⭐⭐ Socket.io ⭐⭐⭐⭐
io.on("connection", (socket) => {
  console.log("🟢 عميل جديد متصل:", socket.id);
  socket.on("join-admin", () => socket.join("admin-room"));
  socket.on("join-user-room", (userId) => {
    const normalizedUserId = String(userId || "").trim();
    if (!normalizedUserId) return;
    socket.join(`user-room-${normalizedUserId}`);
  });
  socket.on("join-company-room", (companyId) => {
    const normalizedCompanyId = String(companyId || "").trim();
    if (!normalizedCompanyId) return;
    socket.join(`company-room-${normalizedCompanyId}`);
  });
  socket.on("error", (error) => console.error("🔴 Socket error:", error));
  socket.on("disconnect", (reason) =>
    console.log("🔴 عميل قطع الاتصال:", socket.id),
  );
});

// ⭐⭐⭐⭐ Middleware للتحقق من حالة قاعدة البيانات ⭐⭐⭐⭐
app.use((req, res, next) => {
  // استثناء مسارات معينة من التحقق
  const publicPaths = [
    "/api/health",
    "/api/debug",
    "/api/test",
    "/api/check-db",
    "/uploads",
  ];

  if (publicPaths.includes(req.path) || req.path.startsWith("/uploads/")) {
    return next();
  }

  // التحقق من حالة قاعدة البيانات
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "قاعدة البيانات غير متصلة، يرجى المحاولة لاحقاً",
      dbStatus: mongoose.connection.readyState,
    });
  }
  next();
});

// ⭐⭐⭐⭐ مسارات التشخيص ⭐⭐⭐⭐
app.get("/api/health", (req, res) => {
  const dbStatus = {
    0: "غير متصل",
    1: "متصل",
    2: "جاري الاتصال",
    3: "جاري قطع الاتصال",
  };

  res.json({
    status: "OK",
    message: "الخادم يعمل",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus[mongoose.connection.readyState] || "غير معروف",
      connected: mongoose.connection.readyState === 1,
    },
    uptime: process.uptime(),
  });
});
app.get("/api/check-db", async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "❌ غير متصل",
    1: "✅ متصل",
    2: "⏳ جاري الاتصال",
    3: "🔌 جاري قطع الاتصال",
  };

  res.json({
    database_status: states[dbState] || "غير معروف",
    database_code: dbState,
    mongodb_uri: process.env.MONGODB_URI ? "موجود في .env" : "غير موجود",
    mongodb_uri_preview: process.env.MONGODB_URI
      ? process.env.MONGODB_URI.substring(0, 30) + "..."
      : "لا يوجد",
    server_time: new Date().toISOString(),
  });
});
app.get("/api/debug", (req, res) => {
  res.json({
    mongodb_uri: process.env.MONGODB_URI ? "موجود" : "غير موجود",
    mongodb_uri_preview: process.env.MONGODB_URI
      ? process.env.MONGODB_URI.substring(0, 20) + "..."
      : "غير موجود",
    db_state: mongoose.connection.readyState,
    port: process.env.PORT,
    node_env: process.env.NODE_ENV,
    cors_origin: process.env.CORS_ORIGIN,
  });
});

// ⭐⭐⭐⭐ المسارات الرئيسية مع معالجة الأخطاء ⭐⭐⭐⭐
const routes = [
  { path: "/api/auth", file: "./routes/auth" },
  { path: "/api/users", file: "./routes/users" },
  { path: "/api/shipments", file: "./routes/shipments" },
  { path: "/api/contacts", file: "./routes/contacts" },
  { path: "/api/wallet", file: "./routes/wallet" },
  { path: "/api/notifications", file: "./routes/notifications" },
  { path: "/api/shipping-companies", file: "./routes/shippingCompanies" },
  { path: "/api/admin", file: "./routes/admin" },
];

routes.forEach((route) => {
  try {
    const routeModule = require(route.file);
    app.use(route.path, routeModule);
    console.log(`✅ Route loaded: ${route.path}`);
  } catch (error) {
    console.error(`❌ فشل تحميل المسار ${route.path}:`, error.message);
    app.use(route.path, (req, res) => {
      res.status(503).json({
        success: false,
        message: `الخدمة ${route.path} غير متوفرة حالياً`,
      });
    });
  }
});

// ⭐⭐⭐⭐ معالجة الأخطاء المركزية ⭐⭐⭐⭐
app.use((err, req, res, next) => {
  console.error("❌ خطأ:", err.message);

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ success: false, message: "خطأ في التحقق من البيانات" });
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ success: false, message: "غير مصرح به" });
  }
  if (err.message.includes("timed out")) {
    return res
      .status(503)
      .json({ success: false, message: "قاعدة البيانات غير مستجيبة" });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "حدث خطأ داخلي في الخادم",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "المسار غير موجود" });
});

// ⭐⭐⭐⭐ بدء الخادم ⭐⭐⭐⭐
const startServer = async () => {
  // الاتصال بقاعدة البيانات أولاً
  const dbConnected = await connectDB();

  if (dbConnected) {
    await ensureAdminUser();
  }

  const PORT = parseInt(process.env.PORT) || 5001;
  const MAX_PORT = 5010;

  const listenOnPort = (port) =>
    new Promise((resolve, reject) => {
      const handleError = (err) => {
        server.off("listening", handleListening);
        reject(err);
      };

      const handleListening = () => {
        server.off("error", handleError);
        resolve();
      };

      server.once("error", handleError);
      server.once("listening", handleListening);
      server.listen(port);
    });

  let selectedPort = null;

  for (let port = PORT; port <= MAX_PORT; port += 1) {
    try {
      await listenOnPort(port);
      selectedPort = port;
      break;
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        console.log(`⚠️ المنفذ ${port} مشغول، نجرب ${port + 1}`);
        continue;
      }

      console.error("❌ خطأ:", err.message);
      process.exit(1);
    }
  }

  if (!selectedPort) {
    console.error("❌ لم نتمكن من العثور على منفذ متاح");
    process.exit(1);
  }

  process.env.ACTIVE_SERVER_PORT = String(selectedPort);
  if (
    String(process.env.PAYMERA_EGATE_CALLBACK_URL || "").includes("localhost")
  ) {
    const callbackMatch = String(process.env.PAYMERA_EGATE_CALLBACK_URL).match(
      /localhost:(\d+)/i,
    );
    const triggerMatch = String(process.env.PAYMERA_EGATE_TRIGGER_URL || "").match(
      /localhost:(\d+)/i,
    );

    if (callbackMatch && callbackMatch[1] !== String(selectedPort)) {
      console.warn(
        `⚠️ Paymera callback URL localhost port mismatch: configured ${callbackMatch[1]}, actual ${selectedPort}.`,
      );
    }
    if (triggerMatch && triggerMatch[1] !== String(selectedPort)) {
      console.warn(
        `⚠️ Paymera trigger URL localhost port mismatch: configured ${triggerMatch[1]}, actual ${selectedPort}.`,
      );
    }
  }

  console.log(`\n🚀 الخادم يعمل على المنفذ ${selectedPort}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📍 CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`,
  );
  console.log(`📝 MongoDB: ${dbConnected ? "✅ متصل" : "❌ غير متصل"}`);

  if (!dbConnected) {
    console.log("\n⚠️  تحذير: قاعدة البيانات غير متصلة!");
    console.log("💡 حلول:");
    console.log("   1. تأكد من صحة MONGODB_URI في ملف .env");
    console.log("   2. تأكد من اتصال الإنترنت");
    console.log("   3. إذا تستخدم MongoDB Atlas، أضف IP في Network Access");
    console.log(
      "   4. أضف MONGODB_URI_FALLBACK=mongodb://127.0.0.1:27017/kashout في .env للتجربة المحلية\n",
    );
  }
};

// تشغيل الخادم
startServer();

module.exports = { app, io };
