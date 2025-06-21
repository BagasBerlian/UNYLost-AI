// File: frontend/src/services/imageService.js
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

/**
 * Layanan untuk mengelola operasi gambar di aplikasi
 */
const imageService = {
  /**
   * Request permission untuk akses galeri foto
   */
  async requestGalleryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin Dibutuhkan",
        "Aplikasi membutuhkan akses ke galeri foto untuk mengupload gambar.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  },

  /**
   * Request permission untuk akses kamera
   */
  async requestCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin Dibutuhkan",
        "Aplikasi membutuhkan akses ke kamera untuk mengambil foto.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  },

  /**
   * Pilih gambar dari galeri
   * @param {Object} options - Opsi untuk pemilihan gambar
   */
  async pickImage(options = {}) {
    const hasPermission = await this.requestGalleryPermission();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...options,
      });

      if (!result.canceled) {
        return this.processImageResult(result);
      }
      return null;
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar");
      return null;
    }
  },

  /**
   * Ambil gambar dari kamera
   * @param {Object} options - Opsi untuk pengambilan gambar
   */
  async takePhoto(options = {}) {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...options,
      });

      if (!result.canceled) {
        return this.processImageResult(result);
      }
      return null;
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Gagal mengambil foto");
      return null;
    }
  },

  /**
   * Proses hasil dari ImagePicker
   * @param {Object} result - Hasil dari ImagePicker
   */
  processImageResult(result) {
    if (!result.assets || result.assets.length === 0) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.uri.split("/").pop(),
      type: this.getMimeType(asset.uri),
    };
  },

  /**
   * Mendapatkan MIME type dari URI gambar
   * @param {string} uri - URI gambar
   */
  getMimeType(uri) {
    const extension = uri.split(".").pop().toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "heic":
        return "image/heic";
      default:
        return "image/jpeg"; // Default to jpeg
    }
  },

  /**
   * Membuat FormData untuk upload gambar
   * @param {Object} imageData - Data gambar dari ImagePicker
   * @param {Object} formFields - Field tambahan untuk FormData
   */
  createFormData(imageData, formFields = {}) {
    const formData = new FormData();

    // Tambahkan gambar jika ada
    if (imageData) {
      formData.append("image", {
        uri: imageData.uri,
        name: imageData.name || "photo.jpg",
        type: imageData.type || "image/jpeg",
      });
    }

    // Tambahkan field lainnya
    Object.keys(formFields).forEach((key) => {
      formData.append(key, formFields[key]);
    });

    return formData;
  },

  /**
   * Membuat FormData untuk multiple gambar
   * @param {Array} images - Array data gambar dari ImagePicker
   * @param {Object} formFields - Field tambahan untuk FormData
   */
  createMultiImageFormData(images, formFields = {}) {
    const formData = new FormData();

    // Tambahkan gambar jika ada
    if (images && images.length > 0) {
      images.forEach((img, index) => {
        formData.append("images", {
          uri: img.uri,
          name: img.name || `photo_${index}.jpg`,
          type: img.type || "image/jpeg",
        });
      });
    }

    // Tambahkan field lainnya
    Object.keys(formFields).forEach((key) => {
      formData.append(key, formFields[key]);
    });

    return formData;
  },
};

export default imageService;
