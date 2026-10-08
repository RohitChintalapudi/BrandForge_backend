require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const securityHeaders = require("./middleware/security.middleware");
const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

connectDB();

// Global Security & Rate Limiting Middleware
app.use(securityHeaders);
app.use(apiLimiter);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://brand-forge-frontend.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Root health check route
app.get("/", (req, res) => {
  res.send("BrandForge API is running 🚀");
});

// Application API routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/campaigns", require("./routes/campaign.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

// 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
