const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");

const registerValidation = [
  body("full_name").notEmpty().withMessage("Nama lengkap harus diisi"),
  body("email").isEmail().withMessage("Email tidak valid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password minimal 6 karakter"),
  body("phone_number")
    .notEmpty()
    .withMessage("Nomor telepon harus diisi")
    .isMobilePhone("id-ID")
    .withMessage("Format nomor telepon tidak valid"),
];

router.post("/register", registerValidation, authController.register);
router.post("/login", authController.login);
router.get("/verify/:token", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
