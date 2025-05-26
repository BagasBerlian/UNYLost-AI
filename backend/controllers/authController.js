const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const db = require("../config/database");
const crypto = require("crypto");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = async (req, res) => {
  try {
    console.log("Register attempt received. Body:", req.body);
    console.log(validationResult(req));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, phone_number, address } = req.body;

    console.log(full_name, email, password, phone_number, address);

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length > 0) {
          return res.status(409).json({ message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const newUser = {
          full_name,
          email,
          password: hashedPassword,
          phone_number,
          address,
          verification_token: verificationToken,
        };

        db.query("INSERT INTO users SET ?", newUser, (error, results) => {
          if (error) {
            console.error("Error registering user:", error);
            return res.status(500).json({ message: "Server error" });
          }

          // Mengirimkan email verifikasi dengan verifikasi token
          // return success

          res.status(201).json({
            message: "User registered successfully",
            userId: results.insertId,
            // Tidak mengirimkan token verification jika sudah di production, kirim pesan email
            // Untuk pengembangan,sementara mengirim verifikasi token
            verificationToken,
          });
        });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = results[0];

        // Check jika user belum verifikasi email (in production)
        // if (!user.is_verified) {
        //   return res.status(401).json({ message: 'Please verify your email before logging in' });
        // }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

        const token = generateToken(user.id);

        res.status(200).json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
          },
        });
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = (req, res) => {
  try {
    const { token } = req.params;

    db.query(
      "SELECT * FROM users WHERE verification_token = ?",
      [token],
      (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res
            .status(400)
            .json({ message: "Invalid verification token" });
        }

        db.query(
          "UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?",
          [results[0].id],
          (error) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Server error" });
            }

            res.status(200).json({ message: "Email verified successfully" });
          }
        );
      }
    );
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(200).json({ message: "Unregistered email" });
        }

        const user = results[0];

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        db.query(
          "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
          [resetToken, resetExpires, user.id],
          (error) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Server error" });
            }

            // {Mengirim email pengaturan ulang kata sandi dengan reset token}
            // return sukses sementara

            res.status(200).json({
              message: "Password reset link sent",
              // Sementara mengirim reset token , tapi seharusnya mengirim email
              resetToken,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    db.query(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token],
      async (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(400).json({ message: "Invalid or expired token" });
        }

        const user = results[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        db.query(
          "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
          [hashedPassword, user.id],
          (error) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Server error" });
            }

            res.status(200).json({ message: "Password reset successful" });
          }
        );
      }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
