// backend/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/auth");

// Route untuk mendapatkan statistik pengguna
router.get(
  "/user-statistics",
  authMiddleware,
  dashboardController.getUserStatistics
);

module.exports = router;
