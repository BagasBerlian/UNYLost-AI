const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const lostItemController = require("../controllers/lostItemController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

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

router.get("/", lostItemController.getAllLostItems);
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
  [authMiddleware, ...lostItemValidation],
  lostItemController.createLostItem
);
router.get("/:id", lostItemController.getLostItemById);
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

module.exports = router;
