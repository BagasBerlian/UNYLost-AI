const nodemailer = require("nodemailer");

// 1. Konfigurasi transporter menggunakan kredensial dari file .env
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// 2. Fungsi untuk mengirim email verifikasi
const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: `"UNY Lost App" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: "Kode Verifikasi untuk Akun UNY Lost App Anda",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Verifikasi Email Anda</h2>
        <p>Terima kasih telah mendaftar di UNY Lost App. Gunakan kode berikut untuk memverifikasi alamat email Anda:</p>
        <div style="font-size: 36px; font-weight: bold; margin: 20px; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px 20px; border-radius: 8px;">
          ${code}
        </div>
        <p>Kode ini akan valid untuk 10 menit ke depan.</p>
        <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">Tim UNY Lost App</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email verifikasi berhasil dikirim ke: ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`Error mengirim email ke ${to}:`, error);
    return { success: false, error: error };
  }
};

module.exports = {
  sendVerificationEmail,
};
