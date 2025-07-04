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
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { categoriesAPI, lostItemAPI } from "../services/api";

export default function ReportLostScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  // FIX: Menggunakan state untuk satu gambar (image), bukan array (images)
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    last_seen_location: "",
    category_id: null,
    lost_date: new Date(),
    reward: 0,
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
        setCategories(response.data.categories);
      } else {
        console.error("Failed to fetch categories:", response.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, lost_date: selectedDate });
    }
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // FIX: Hanya memperbolehkan memilih satu gambar
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // FIX: Ambil gambar pertama dari array assets dan set ke state 'image'
        const selectedImage = result.assets[0];
        setImage({
          uri: selectedImage.uri,
          name: selectedImage.fileName || selectedImage.uri.split("/").pop(),
          type: selectedImage.type || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar");
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.item_name.trim())
      newErrors.item_name = "Nama barang harus diisi";
    if (!formData.description.trim())
      newErrors.description = "Deskripsi barang harus diisi";
    if (!formData.last_seen_location.trim())
      newErrors.last_seen_location = "Lokasi terakhir harus diisi";
    if (!formData.category_id) newErrors.category_id = "Kategori harus dipilih";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Form Belum Lengkap",
        "Harap lengkapi semua field yang wajib diisi (*)."
      );
      return;
    }

    setLoading(true);

    try {
      const formattedDate = formData.lost_date.toISOString().split("T")[0];

      const submitData = {
        item_name: formData.item_name,
        description: formData.description,
        last_seen_location: formData.last_seen_location,
        category_id: formData.category_id,
        lost_date: formattedDate,
        reward: formData.reward > 0 ? formData.reward.toString() : null,
      };

      // FIX: Mengirim `image` (singular) ke API
      const response = await lostItemAPI.create(submitData, image);

      if (response.success) {
        Alert.alert("Sukses", "Laporan Anda telah berhasil dikirim.");
        navigation.navigate("ReportSuccess", {
          type: "lost",
          itemId: response.data.item.id,
          reportId: `UNYLOST-${response.data.item.id}`,
        });
      } else {
        Alert.alert("Error", response.message || "Gagal mengirim laporan");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mengirim laporan");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (value) => {
    return `Rp ${Number(value).toLocaleString("id-ID")}`;
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LAPORKAN KEHILANGAN</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color="#3478F6" />
            <Text style={styles.infoText}>
              Isi detail barang yang hilang dengan lengkap untuk memudahkan
              proses pencarian.
            </Text>
          </View>

          {/* FIX: Ubah tampilan untuk satu gambar */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Unggah Foto Barang <Text style={styles.optional}>(Opsional)</Text>
            </Text>
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                <Ionicons name="image-outline" size={36} color="#3478F6" />
                <Text style={styles.uploadText}>Klik untuk memilih foto</Text>
                <Text style={styles.uploadSubtext}>
                  Format: JPG, PNG (Maks. 5MB)
                </Text>
              </TouchableOpacity>
            )}
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
                placeholder="Contoh: Dompet kulit hitam"
                value={formData.item_name}
                onChangeText={(text) => handleInputChange("item_name", text)}
              />
            </View>
            {errors.item_name && (
              <Text style={styles.errorText}>{errors.item_name}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Deskripsi Detail Barang <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Jelaskan detail barang seperti warna, merek, kondisi, dll."
              multiline
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Lokasi Terakhir <Text style={styles.required}>*</Text>
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
                value={formData.last_seen_location}
                onChangeText={(text) =>
                  handleInputChange("last_seen_location", text)
                }
              />
            </View>
            {errors.last_seen_location && (
              <Text style={styles.errorText}>{errors.last_seen_location}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Kategori <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Ionicons
                name="pricetag-outline"
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
            {showCategoryPicker && (
              <View style={styles.dropdownContainer}>
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
                      name={category.icon || "pricetag-outline"}
                      size={20}
                      color="#3478F6"
                    />
                    <Text style={styles.dropdownItemText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Tanggal Hilang <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color="#A3A3A3"
                style={styles.inputIcon}
              />
              <Text style={[styles.pickerText, styles.activePickerText]}>
                {formatDate(formData.lost_date)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.lost_date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>
              Hadiah <Text style={styles.optional}>(Opsional)</Text>
            </Text>
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardValue}>
                {formatCurrency(formData.reward)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={500000}
              step={10000}
              value={formData.reward}
              onValueChange={(value) => handleInputChange("reward", value)}
              minimumTrackTintColor="#3478F6"
              maximumTrackTintColor="#E5E5EA"
              thumbTintColor="#3478F6"
            />
            <Text style={styles.rewardHint}>
              Menambahkan hadiah dapat meningkatkan peluang barang ditemukan.
            </Text>
          </View>

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

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// Salin Stylesheet dari file asli, karena tidak ada error di dalamnya
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: {
    backgroundColor: "#3478F6",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 15 },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, padding: 16 },
  infoBanner: {
    backgroundColor: "#E8F1FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  infoText: { flex: 1, marginLeft: 10, color: "#3478F6", fontSize: 15 },
  formSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  required: { color: "#FF3B30" },
  optional: { color: "#8E8E93", fontWeight: "normal", fontSize: 14 },
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
  uploadSubtext: { fontSize: 14, color: "#8E8E93", marginTop: 4 },
  imagePreviewContainer: { alignItems: "center", marginBottom: 16 },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    padding: 4,
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
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 16, color: "#333" },
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
  pickerText: { flex: 1, fontSize: 16, color: "#A3A3A3" },
  activePickerText: { color: "#333" },
  dropdownContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginTop: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  dropdownItemText: { fontSize: 16, color: "#333", marginLeft: 8 },
  rewardContainer: { alignItems: "center", marginVertical: 8 },
  rewardValue: { fontSize: 18, color: "#333", fontWeight: "600" },
  slider: { width: "100%", height: 40 },
  rewardHint: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  errorText: { color: "#FF3B30", fontSize: 14, marginTop: 4 },
  submitButton: {
    backgroundColor: "#3478F6",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
