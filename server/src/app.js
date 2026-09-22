const express = require("express");
const cors = require("cors");
const { apiLimiter } = require("./middleware/rateLimiter");
const authRoutes = require("./routes/auth.routes");
const pasteRoutes = require("./routes/paste.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "600kb" }));
app.use(apiLimiter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/pastes", pasteRoutes);

// 404 handler
app.use("/api", (_req, res) => res.status(404).json({ message: "Not found" }));

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error("[app] unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

module.exports = app;
