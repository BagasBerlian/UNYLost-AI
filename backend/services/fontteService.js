const axios = require("axios");

const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
const FONNTE_BASE_URL = "https://api.fonnte.com";

const fontteService = {
  /**
   * Memeriksa apakah nomor terdaftar di WhatsApp (versi development)
   * @param {string} phoneNumber - Nomor telepon
   * @returns {Promise<Object>} - Status verifikasi
   */
  async checkWhatsappNumber(phoneNumber) {
    // Format nomor telepon
    let formattedNumber = phoneNumber;

    // Hapus karakter '+' jika ada
    if (formattedNumber.startsWith("+")) {
      formattedNumber = formattedNumber.substring(1);
    }

    // Jika dimulai dengan '0', ganti dengan '62'
    if (formattedNumber.startsWith("0")) {
      formattedNumber = "62" + formattedNumber.substring(1);
    }

    // Jika belum memiliki kode negara, tambahkan '62'
    if (!formattedNumber.startsWith("62") && !formattedNumber.startsWith("1")) {
      formattedNumber = "62" + formattedNumber;
    }

    console.log("Formatted phone number:", formattedNumber);

    // Untuk development, kita anggap semua nomor valid
    return {
      success: true,
      isRegistered: true,
      message: "Nomor terdaftar di WhatsApp",
      number: formattedNumber,
    };
  },

  /**
   * Mengirim kode verifikasi via WhatsApp (versi development)
   * @param {string} phoneNumber - Nomor telepon
   * @returns {Promise<Object>} - Status pengiriman
   */
  async sendVerificationCode(phoneNumber) {
    // Generate kode verifikasi (6 digit)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log(
      `[DEV] Kode verifikasi untuk ${phoneNumber}: ${verificationCode}`
    );

    // Untuk development, kita anggap pesan berhasil dikirim
    return {
      success: true,
      message: "Kode verifikasi berhasil dikirim",
      code: verificationCode, // Untuk keperluan development saja
    };
  },
};

module.exports = fontteService;
