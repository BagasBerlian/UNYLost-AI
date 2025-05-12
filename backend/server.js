require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categories");
const foundItemRoutes = require("./routes/foundItems");
const lostItemRoutes = require("./routes/lostItems");
const claimRoutes = require("./routes/claims");
const db = require("./config/database");

const app = express();

app.use(cors());
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

app.get("/", (req, res) => {
  res.send("UNYLost API is running");
});

app.use("/api/auth", authRoutes);
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
