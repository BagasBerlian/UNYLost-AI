const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const db = require("../config/database");
const crypto = require("crypto");
const fontteService = require("../services/fontteService");
const { sendVerificationEmail } = require("../services/emailService");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, phone_number, address } = req.body;

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
        const verificationToken = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        console.log(
          `[DEV] Kode Verifikasi Email untuk ${email}: ${verificationToken}`
        );

        const newUser = {
          full_name,
          email,
          password: hashedPassword,
          phone_number,
          address,
          verification_token: verificationToken,
        };

        db.query("INSERT INTO users SET ?", newUser, (error, insertResult) => {
          if (error) {
            console.error("Error registering user:", error);
            return res.status(500).json({ message: "Server error" });
          }

          const newUserId = insertResult.insertId;

          // Ambil data user yang baru dibuat untuk dikirim kembali ke frontend
          db.query(
            "SELECT id, full_name, email, phone_number, role FROM users WHERE id = ?",
            [newUserId],
            async (err, userRows) => {
              if (err) {
                console.error("Error fetching new user:", err);
                return res.status(500).json({ message: "Server error" });
              }

              // Kirim email verifikasi
              try {
                await sendVerificationEmail(email, verificationToken);
              } catch (emailError) {
                console.error(
                  "Gagal mengirim email verifikasi, tapi user tetap terdaftar:",
                  emailError
                );
              }

              // Kirim respons ke frontend dengan menyertakan objek user
              res.status(201).json({
                success: true,
                message:
                  "Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi.",
                user: userRows[0],
              });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyWhatsapp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Nomor telepon harus diisi.",
      });
    }

    // Kirim kode verifikasi via Fonnte
    const sendResult = await fontteService.sendVerificationCode(phone);

    if (!sendResult.success) {
      // Jika Fonnte mengembalikan error, teruskan pesannya ke client
      return res.status(400).json({
        success: false,
        message: sendResult.message,
      });
    }

    // PENTING: Pada produksi, JANGAN kembalikan kode ke client.
    // Kode ini dikembalikan hanya untuk mempermudah development/testing.
    return res.status(200).json({
      success: true,
      message: "Kode verifikasi telah dikirim ke WhatsApp Anda.",
      code:
        process.env.NODE_ENV === "development" ? sendResult.code : undefined,
    });
  } catch (error) {
    console.error("WhatsApp verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat verifikasi WhatsApp.",
    });
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
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email dan kode verifikasi harus diisi" });
    }

    db.query(
      "SELECT * FROM users WHERE email = ? AND verification_token = ?",
      [email, code],
      (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Server error" });
        }

        if (results.length === 0) {
          return res.status(400).json({
            message: "Kode verifikasi tidak valid atau sudah kedaluwarsa",
          });
        }

        const user = results[0];

        db.query(
          "UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?",
          [user.id],
          (error) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Server error" });
            }

            res
              .status(200)
              .json({ success: true, message: "Email berhasil diverifikasi" });
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
