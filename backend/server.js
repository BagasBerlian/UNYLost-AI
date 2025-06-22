require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const categoryRoutes = require("./routes/categories");
const foundItemRoutes = require("./routes/foundItems");
const lostItemRoutes = require("./routes/lostItems");
const claimRoutes = require("./routes/claims");
const scheduledTasks = require("./services/scheduledTasks");
const db = require("./config/database");

const app = express();
// scheduledTasks.startSyncJobs();

// try {
//   const LostItem = require("./models/LostItem");
//   LostItem.addSyncFields()
//     .then(() => console.log("Lost Item sync fields initialized"))
//     .catch((err) => console.error("Error initializing sync fields:", err));
// } catch (error) {
//   console.error("Error during model initialization:", error);
// }

app.use(
  cors({
    origin: "*", // Untuk pengembangan
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected successfully");
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "UNYLost API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("UNYLost API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/found-items", foundItemRoutes);
app.use("/api/lost-items", lostItemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
