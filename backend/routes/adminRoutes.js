const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

router.use(authMiddleware, adminMiddleware);

router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put(
  "/users/:userId/role",
  [
    body("role")
      .isIn(["user", "admin"])
      .withMessage("Role harus 'user' atau 'admin'"),
  ],
  adminController.updateUserRole
);
router.get("/dashboard", adminController.getDashboardStats);
router.post(
  "/sync-lost-items",
  [authMiddleware, adminMiddleware],
  adminController.syncLostItemsToFirestore
);

module.exports = router;
