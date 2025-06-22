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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { categoriesAPI, lostItemsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ReportLostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
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

    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Deskripsi barang harus diisi";
    }

    if (
      !formData.last_seen_location ||
      formData.last_seen_location.trim() === ""
    ) {
      newErrors.last_seen_location = "Lokasi terakhir harus diisi";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Kategori harus dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Harap lengkapi semua field yang diperlukan");
      return;
    }

    setLoading(true);

    try {
      const formattedDate = formData.lost_date.toISOString().split("T")[0];

      const submitData = {
        item_name: formData.item_name || "Barang Hilang",
        description: formData.description,
        last_seen_location: formData.last_seen_location,
        category_id: formData.category_id,
        lost_date: formattedDate,
        reward: formData.reward > 0 ? formData.reward.toString() : null,
      };

      const response = await lostItemsAPI.create(submitData, image);

      setLoading(false);

      if (response.success) {
        navigation.navigate("ReportSuccess", {
          type: "lost",
          itemId: response.data.item.id,
          reportId: `UNY${Math.floor(1000000 + Math.random() * 9000000)}`,
        });
      } else {
        Alert.alert("Error", response.message || "Gagal mengirim laporan");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mengirim laporan");
    }
  };

  // Format date for display
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  // Format currency
  const formatCurrency = (value) => {
    return `Rp. ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const selectedCategory = categories.find(
    (c) => c.id === formData.category_id
  );

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#3478F6" />
          <Text style={styles.infoText}>
            Silakan isi detail barang yang kamu hilangkan dengan lengkap untuk
            memudahkan proses pencarian.
          </Text>
        </View>

        {/* Upload Photo Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Unggah Foto Barang <Text style={styles.optional}>(Opsional)</Text>
          </Text>

          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <Ionicons name="image-outline" size={36} color="#3478F6" />
            <Text style={styles.uploadText}>Klik untuk memasukkan foto</Text>
            <Text style={styles.uploadSubtext}>
              Format: JPG, PNG (Maks. 5MB)
            </Text>
          </TouchableOpacity>

          {/* Image Preview */}
          {image && (
            <View style={styles.imagePreviewContainer}>
              <View style={styles.imagePreview}>
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
            </View>
          )}

          <Text style={styles.photoCount}>
            {image ? "1" : "0"} foto dipilih
          </Text>
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
              placeholderTextColor="#A3A3A3"
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

          {/* Category Picker Dropdown */}
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

        {/* Date Section */}
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
            <Ionicons name="calendar" size={24} color="#A3A3A3" />
          </TouchableOpacity>

          {/* Date Picker Modal */}
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

        {/* Reward Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Hadiah <Text style={styles.optional}>(Opsional)</Text>
          </Text>

          <View style={styles.rewardContainer}>
            <Text style={styles.rewardValue}>Rp. 0</Text>
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
            <Text style={styles.rewardValue}>Rp. 500.000</Text>
          </View>

          <View style={styles.rewardInputContainer}>
            <Text style={styles.rewardLabel}>hadiah:</Text>
            <TextInput
              style={styles.rewardInput}
              placeholder="Rp. 0"
              placeholderTextColor="#A3A3A3"
              keyboardType="number-pad"
              value={formData.reward > 0 ? formatCurrency(formData.reward) : ""}
              onChangeText={(text) => {
                // Extract numbers only
                const numericValue = parseInt(text.replace(/[^0-9]/g, "")) || 0;
                if (numericValue <= 500000) {
                  handleInputChange("reward", numericValue);
                }
              }}
            />
          </View>

          <Text style={styles.rewardHint}>
            Tambahkan reward untuk meningkatkan peluang barang ditemukan
          </Text>
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
  required: {
    color: "#FF3B30",
  },
  optional: {
    color: "#8E8E93",
    fontWeight: "normal",
    fontSize: 14,
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
    marginTop: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
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
  dropdownContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginTop: 8,
    maxHeight: 200,
    overflow: "scroll",
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
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  rewardValue: {
    fontSize: 14,
    color: "#8E8E93",
    width: 80,
  },
  rewardInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  rewardLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginRight: 8,
  },
  rewardInput: {
    flex: 1,
    height: 40,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
  rewardHint: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
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
