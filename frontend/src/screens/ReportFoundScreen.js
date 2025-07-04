import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { categoriesAPI, foundItemAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.134.105:5000/api";

export default function ReportFoundScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    location: "",
    category_id: null,
    found_date: new Date(),
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    requestMediaLibraryPermissions();
  }, []);

  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Diperlukan",
          "Maaf, kami membutuhkan izin untuk mengakses galeri foto Anda."
        );
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.success && response.data.categories) {
        console.log("Categories loaded:", response.data.categories);
        setCategories(response.data.categories);
      } else {
        console.error("Failed to fetch categories:", response.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const createFoundItem = async (formData) => {
    try {
      // Log detail koneksi
      console.log("--------- DETAIL KONEKSI ---------");
      console.log("API URL:", `${API_URL}/found-items`);
      console.log("Metode:", "POST");
      console.log("Headers Content-Type:", "multipart/form-data");

      const token = await AsyncStorage.getItem("userToken");
      console.log("Token tersedia:", token ? "Ya" : "Tidak");

      // Coba uji koneksi terlebih dahulu dengan permintaan sederhana
      try {
        console.log("Mencoba koneksi ke server...");
        const pingResponse = await axios.get(`${API_URL}/health`);
        console.log("Koneksi berhasil, server merespons:", pingResponse.status);
      } catch (pingError) {
        console.error("Gagal terhubung ke server:", pingError);
        throw new Error(
          "Tidak dapat terhubung ke server. Pastikan server berjalan dan URL benar."
        );
      }

      // Jika ping berhasil, lanjutkan dengan permintaan utama
      console.log("Mengirim data utama...");
      const response = await axios.post(`${API_URL}/found-items`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        // Tambahkan timeout untuk memastikan tidak menunggu terlalu lama
        timeout: 30000, // 30 detik
      });

      console.log("Response from server:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("API Error - createItem:", error);

      // Detail error
      if (error.code === "ECONNABORTED") {
        console.log("Error: Permintaan timeout");
        return {
          success: false,
          message: "Permintaan timeout. Coba lagi nanti.",
        };
      }

      if (error.response) {
        // Server merespons dengan status error
        console.log("Server response status:", error.response.status);
        console.log("Server response data:", error.response.data);
        return {
          success: false,
          message: error.response?.data?.message || "Server menolak permintaan",
        };
      } else if (error.request) {
        // Permintaan dibuat tetapi tidak ada respons
        console.log("Tidak ada respons dari server");
        return {
          success: false,
          message: "Tidak ada respons dari server. Periksa koneksi Anda.",
        };
      } else {
        // Error saat menyiapkan permintaan
        console.log("Error setup request:", error.message);
        return {
          success: false,
          message: `Error saat menyiapkan permintaan: ${error.message}`,
        };
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // DateTimePicker handlers
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirmDate = (date) => {
    setFormData({ ...formData, found_date: date });
    hideDatePicker();
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Izin Diperlukan",
          "Aplikasi membutuhkan izin untuk mengakses galeri foto Anda."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Limit to 5 images max
        const newImages = [...images, ...result.assets].slice(0, 5);
        setImages(newImages);

        // Tambahkan log untuk verifikasi
        console.log("Gambar terpilih:", JSON.stringify(result.assets));
        console.log("Total gambar saat ini:", newImages.length);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar");
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_name || formData.item_name.trim() === "") {
      newErrors.item_name = "Nama barang harus diisi";
    }

    if (images.length < 2) {
      newErrors.images = "Minimal 2 foto diperlukan";
    }

    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Deskripsi barang harus diisi";
    }

    if (!formData.location || formData.location.trim() === "") {
      newErrors.location = "Lokasi ditemukan harus diisi";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Kategori harus dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getIoniconName = (iconName) => {
    // Jika iconName kosong atau undefined
    if (!iconName) return "pricetag-outline";

    // Pemetaan ikon dari database ke ikon Ionicons yang tersedia
    const iconMapping = {
      // Sesuai database yang ditunjukkan
      wallet: "wallet-outline",
      smartphone: "phone-portrait-outline",
      "credit-card": "card-outline",
      key: "key-outline",
      book: "book-outline",
      watch: "time-outline",
      shirt: "shirt-outline",
      package: "cube-outline",
    };
    return iconMapping[iconName] || "pricetag-outline";
  };

  const handleSubmit = async () => {
    console.log("API URL yang digunakan:", `${API_URL}/found-items`);
    try {
      // Coba ping server dulu
      const pingResult = await fetch(`${API_URL}/health`, { method: "GET" });
      console.log("Ping berhasil:", pingResult.ok);
    } catch (error) {
      console.log("Ping gagal:", error.message);
    }
    if (!validateForm()) return;

    setLoading(true);

    const formatDateForMySQL = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    try {
      // Create FormData object to send multipart/form-data
      const formDataObj = new FormData();

      // Add text fields to FormData
      formDataObj.append("item_name", formData.item_name);
      formDataObj.append("description", formData.description);
      formDataObj.append("location", formData.location);
      formDataObj.append("category_id", formData.category_id);
      formDataObj.append("found_date", formatDateForMySQL(formData.found_date));

      // Add images to FormData
      images.forEach((image, index) => {
        const fileName = `image_${index}.jpg`;

        // Use simple string append, not object
        formDataObj.append("images", image.uri, fileName);
      });

      // Log what we're sending for debugging
      console.log("Sending form data:", Object.fromEntries(formDataObj._parts));

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem("userToken");

      // Send request
      const response = await axios.post(`${API_URL}/found-items`, formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      });

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Show success message
      Alert.alert("Sukses", "Laporan barang temuan berhasil dikirim!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error submitting form:", error);

      let errorMessage = "Terjadi kesalahan saat mengirim laporan";

      if (error.response) {
        console.log("Error response:", error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display - hanya tampilkan tanggal
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const selectedCategory = categories.find(
    (c) => c.id === formData.category_id
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LAPORKAN TEMUAN</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color="#3478F6" />
            <Text style={styles.infoText}>
              Silakan isi detail barang yang kamu temukan dengan lengkap untuk
              memudahkan proses pengembalian.
            </Text>
          </View>

          {/* Upload Photo Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Unggah Foto Barang <Text style={styles.required}>*</Text>
              <Text style={styles.sectionSubtitle}> (minimal 2 foto)</Text>
            </Text>

            {/* Tombol upload hanya ditampilkan jika images.length < 5 */}
            {images.length < 5 && (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                <Ionicons name="image-outline" size={36} color="#3478F6" />
                <Text style={styles.uploadText}>
                  Klik untuk memasukkan foto
                </Text>
                <Text style={styles.uploadSubtext}>
                  Format: JPG, PNG (Maks. 5MB)
                </Text>
              </TouchableOpacity>
            )}

            {errors.images && (
              <Text style={styles.errorText}>{errors.images}</Text>
            )}

            {/* Image Preview */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.photoCount}>
              {images.length} foto dipilih (min. 2, maks. 5)
            </Text>
          </View>

          {/* Nama Barang */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Nama Barang <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="cube-outline"
                size={24}
                color="#A3A3A3"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contoh: Dompet Hitam, Botol Minum, dll."
                placeholderTextColor="#A3A3A3"
                value={formData.item_name}
                onChangeText={(text) => handleInputChange("item_name", text)}
              />
            </View>
            {errors.item_name && (
              <Text style={styles.errorText}>{errors.item_name}</Text>
            )}
          </View>

          {/* Description Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Deskripsi Detail Barang <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Jelaskan detail barang seperti warna, merek, kondisi, dll."
              placeholderTextColor="#A3A3A3"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Location Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Lokasi Ditemukan <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={24}
                color="#A3A3A3"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contoh: Gedung FMIPA Lantai 2"
                placeholderTextColor="#A3A3A3"
                value={formData.location}
                onChangeText={(text) => handleInputChange("location", text)}
              />
            </View>
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
          </View>

          {/* Category Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Kategori <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Ionicons
                name={
                  selectedCategory
                    ? getIoniconName(selectedCategory.icon)
                    : "pricetag-outline"
                }
                size={24}
                color="#A3A3A3"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.pickerText,
                  selectedCategory ? styles.activePickerText : {},
                ]}
              >
                {selectedCategory
                  ? selectedCategory.name
                  : "Pilih kategori barang"}
              </Text>
              <Ionicons name="chevron-down" size={24} color="#A3A3A3" />
            </TouchableOpacity>
            {errors.category_id && (
              <Text style={styles.errorText}>{errors.category_id}</Text>
            )}

            {/* Category Picker Dropdown */}
            {showCategoryPicker && (
              <View style={styles.dropdownContainer}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleInputChange("category_id", category.id);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Ionicons
                        name={getIoniconName(category.icon)}
                        size={20}
                        color="#3478F6"
                      />
                      <Text style={styles.dropdownItemText}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Section dengan DateTimePickerModal - hanya tanggal */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Tanggal Ditemukan <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={showDatePicker}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color="#A3A3A3"
                style={styles.inputIcon}
              />
              <Text style={[styles.pickerText, styles.activePickerText]}>
                {formatDate(formData.found_date)}
              </Text>
              <Ionicons name="calendar" size={24} color="#A3A3A3" />
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              date={formData.found_date}
              maximumDate={new Date()}
              isDarkModeEnabled={false}
              cancelTextIOS="Batal"
              confirmTextIOS="Konfirmasi"
              headerTextIOS="Pilih Tanggal"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Kirim Laporan</Text>
            )}
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    backgroundColor: "#3478F6",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBanner: {
    backgroundColor: "#E8F1FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: "#3478F6",
    fontSize: 15,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#666",
  },
  required: {
    color: "#FF3B30",
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C7C7CC",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9FB",
  },
  uploadText: {
    fontSize: 16,
    color: "#3478F6",
    marginTop: 8,
    fontWeight: "500",
  },
  uploadSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  imagePreview: {
    width: 80,
    height: 80,
    margin: 4,
    borderRadius: 8,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  photoCount: {
    marginTop: 8,
    fontSize: 14,
    color: "#8E8E93",
  },
  textArea: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 12,
    height: 50,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: "#A3A3A3",
  },
  activePickerText: {
    color: "#333",
  },
  dropdownScroll: {
    maxHeight: 150,
    width: "100%",
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginTop: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#3478F6",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
