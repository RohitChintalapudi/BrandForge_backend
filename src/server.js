require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/campaigns", require("./routes/campaign.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
