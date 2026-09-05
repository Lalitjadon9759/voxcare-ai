const express = require("express");
const cors = require("cors");

const voiceRoutes = require("./routes/voice.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VoxCare AI server is running",
  });
});

app.use("/api/voice", voiceRoutes);

module.exports = app;