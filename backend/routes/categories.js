const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const categoryValidation = [
  body("name").notEmpty().withMessage("Nama kategori harus diisi"),
  body("description").optional(),
  body("icon").optional(),
  body("priority")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Prioritas harus berupa angka positif"),
];

router.get("/", authMiddleware, categoryController.getAllCategories);
router.get("/:id", authMiddleware, categoryController.getCategoryById);
router.post(
  "/",
  [authMiddleware, adminMiddleware, ...categoryValidation],
  categoryController.createCategory
);
router.put(
  "/:id",
  [authMiddleware, adminMiddleware, ...categoryValidation],
  categoryController.updateCategory
);
router.delete(
  "/:id",
  [authMiddleware, adminMiddleware],
  categoryController.deleteCategory
);

module.exports = router;
