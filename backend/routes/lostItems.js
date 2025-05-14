const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const lostItemController = require("../controllers/lostItemController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const multer = require("multer");
const path = require("path");
const { route } = require("./foundItems");

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

const lostItemValidation = [
  body("item_name").notEmpty().withMessage("Nama barang harus diisi"),
  body("category_id").notEmpty().withMessage("Kategori harus dipilih"),
  body("description").optional(),
  body("last_seen_location")
    .notEmpty()
    .withMessage("Lokasi terakhir dilihat harus diisi"),
  body("lost_date").notEmpty().withMessage("Tanggal hilang harus diisi"),
  body("image_url").optional().isURL().withMessage("URL gambar tidak valid"),
  body("reward").optional(),
];

router.get(
  "/",
  [authMiddleware, adminMiddleware],
  lostItemController.getAllLostItems
);
router.get("/search", lostItemController.searchLostItems);
router.get("/my-items", authMiddleware, lostItemController.getLostItemsByUser);
router.get(
  "/user/:userId",
  [authMiddleware, adminMiddleware],
  lostItemController.getLostItemsByUser
);
router.get("/category/:categoryId", lostItemController.getLostItemsByCategory);
router.get(
  "/:id/matches",
  authMiddleware,
  lostItemController.findPotentialMatches
);
router.post(
  "/",
  [authMiddleware, upload.single("image"), ...lostItemValidation],
  lostItemController.createLostItem
);

router.get(
  "/:id",
  [authMiddleware, adminMiddleware],
  lostItemController.getLostItemById
);
router.put(
  "/:id",
  [authMiddleware, ...lostItemValidation],
  lostItemController.updateLostItem
);
router.delete("/:id", authMiddleware, lostItemController.deleteLostItem);
router.put(
  "/:id/status",
  [
    authMiddleware,
    body("status")
      .isIn(["active", "found", "closed"])
      .withMessage("Status tidak valid"),
  ],
  lostItemController.updateLostItemStatus
);

router.post(
  "/find-matches",
  [authMiddleware, upload.single("image")],
  lostItemController.findMatchingItems
);

module.exports = router;
