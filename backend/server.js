const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// ⭐⭐⭐⭐ إصلاح ترتيب middleware ⭐⭐⭐⭐
// 1. أولاً: JSON parser (الأهم)
app.use(express.json());

// 2. ثانياً: URL-encoded parser
app.use(express.urlencoded({ extended: true }));

// 3. ثالثاً: CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Make io accessible to routes
app.set("io", io);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-admin", () => {
    socket.join("admin-room");
    console.log("Admin joined room");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/shipments", require("./routes/shipments"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Kashout Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, io };
