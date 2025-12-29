require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", // local dev
      "https://brand-forge-frontend.vercel.app", // deployed frontend
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/campaigns", require("./routes/campaign.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));

// Health check (optional but useful on Render)
app.get("/", (req, res) => {
  res.send("BrandForge API is running 🚀");
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
