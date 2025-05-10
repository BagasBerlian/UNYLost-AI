const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const claimController = require("../controllers/claimController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const claimValidation = [
  body("item_id").notEmpty().withMessage("ID barang harus diisi"),
  body("description").notEmpty().withMessage("Deskripsi klaim harus diisi"),
  body("lost_location").optional(),
  body("lost_date").optional(),
  body("additional_proof").optional(),
];

router.get(
  "/",
  [authMiddleware, adminMiddleware],
  claimController.getAllClaims
);
router.get("/my-claims", authMiddleware, claimController.getUserClaims);
router.get(
  "/user/:userId",
  [authMiddleware, adminMiddleware],
  claimController.getUserClaims
);
router.get("/item/:itemId", authMiddleware, claimController.getItemClaims);
router.post(
  "/",
  [authMiddleware, ...claimValidation],
  claimController.createClaim
);
router.get("/:id", authMiddleware, claimController.getClaimById);
router.put(
  "/:id/status",
  [
    authMiddleware,
    adminMiddleware,
    body("status")
      .isIn(["pending", "approved", "rejected"])
      .withMessage("Status tidak valid"),
    body("admin_notes").optional(),
  ],
  claimController.updateClaimStatus
);

module.exports = router;
