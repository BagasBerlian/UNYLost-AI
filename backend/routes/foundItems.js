const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const foundItemController = require("../controllers/foundItemController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, and PNG files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

const foundItemValidation = [
  body("item_name").notEmpty().withMessage("Nama barang harus diisi"),
  body("category_id").notEmpty().withMessage("Kategori harus dipilih"),
  body("description").optional(),
  body("location").notEmpty().withMessage("Lokasi ditemukan harus diisi"),
  body("found_date").notEmpty().withMessage("Tanggal ditemukan harus diisi"),
];

router.get(
  "/",
  [authMiddleware, adminMiddleware],
  foundItemController.getAllFoundItems
);

router.get(
  "/search",
  [authMiddleware, adminMiddleware],
  foundItemController.searchFoundItems
);

router.get(
  "/user/:userId",
  [authMiddleware, adminMiddleware],
  foundItemController.getFoundItemsByUser
);

router.get(
  "/my-items",
  authMiddleware,
  foundItemController.getFoundItemsByUser
);

router.get(
  "/category/:categoryId",
  [authMiddleware, adminMiddleware],
  foundItemController.getFoundItemsByCategory
);

router.post(
  "/find-matches",
  authMiddleware,
  foundItemController.findMatchingItems
);

router.post(
  "/",
  [authMiddleware, upload.array("images", 5), ...foundItemValidation],
  foundItemController.createFoundItem
);

router.get("/:id", foundItemController.getFoundItemById);

router.put(
  "/:id",
  [authMiddleware, ...foundItemValidation],
  foundItemController.updateFoundItem
);

router.post(
  "/:id/images",
  [authMiddleware, upload.array("images", 5)],
  foundItemController.addItemImages
);

router.delete(
  "/:id/images/:imageId",
  authMiddleware,
  foundItemController.deleteItemImage
);

router.put(
  "/:id/images/:imageId/primary",
  authMiddleware,
  foundItemController.setPrimaryImage
);

router.delete("/:id", authMiddleware, foundItemController.deleteFoundItem);

router.put(
  "/:id/status",
  [
    authMiddleware,
    adminMiddleware,
    body("status")
      .isIn(["pending", "approved", "claimed", "returned", "rejected"])
      .withMessage("Status tidak valid"),
  ],
  foundItemController.updateFoundItemStatus
);

router.use("/uploads", express.static("uploads"));

module.exports = router;
