const axios = require("axios");

// Ambil API Key dari environment variable
const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

/**
 * Mengirim pesan WhatsApp melalui API Fonnte.
 * @param {string} phoneNumber - Nomor tujuan, akan diformat otomatis.
 * @param {string} message - Pesan yang akan dikirim.
 * @returns {Promise<Object>} - Status pengiriman.
 */
async function sendMessage(phoneNumber, message) {
  if (!FONNTE_API_KEY) {
    console.error("FONNTE_API_KEY tidak ditemukan di file .env");
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  // Format nomor: hapus non-digit, pastikan berawalan '62'
  let target = phoneNumber.replace(/\D/g, "");
  if (target.startsWith("0")) {
    target = "62" + target.substring(1);
  }

  try {
    const response = await axios.post(
      "https://api.fonnte.com/send",
      {
        target: target,
        message: message,
      },
      {
        headers: {
          Authorization: FONNTE_API_KEY,
        },
      }
    );

    console.log("Respons dari Fonnte:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "Error saat mengirim pesan via Fonnte:",
      error.response ? error.response.data : error.message
    );
    const errorMessage =
      error.response?.data?.reason || "Gagal mengirim pesan ke nomor WhatsApp.";
    return { success: false, message: errorMessage };
  }
}

/**
 * Membuat dan mengirim kode verifikasi via WhatsApp.
 * @param {string} phoneNumber - Nomor tujuan.
 * @returns {Promise<Object>} - Hasil pengiriman beserta kode jika berhasil.
 */
async function sendVerificationCode(phoneNumber) {
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  console.log(
    `[DEV] Kode Verifikasi WhatsApp untuk ${phoneNumber}: ${verificationCode}`
  );

  const message = `Kode verifikasi untuk UNY Lost App Anda adalah: *${verificationCode}*. Jangan berikan kode ini kepada siapa pun.`;

  const result = await sendMessage(phoneNumber, message);

  if (result.success) {
    return {
      success: true,
      message: "Kode verifikasi berhasil dikirim.",
      code: verificationCode, // Kode dikembalikan untuk mempermudah testing di environment development
    };
  } else {
    return {
      success: false,
      message: result.message,
    };
  }
}

module.exports = {
  sendVerificationCode,
  sendMessage,
};
