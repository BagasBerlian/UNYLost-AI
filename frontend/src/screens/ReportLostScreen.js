import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { lostItemAPI, categoryAPI } from "../services/api";
import imageService from "../services/imageService";

const { width } = Dimensions.get("window");

export default function ReportLostScreen() {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    categoryId: null,
    lastSeenLocation: "",
    lostDate: new Date(),
    reward: 0,
    image: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  // Ambil daftar kategori saat halaman dimuat
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function untuk mengambil daftar kategori dari API
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await categoryAPI.getCategories(token);

      if (response.success) {
        setCategories(response.data);
      } else {
        console.error("Failed to fetch categories:", response.message);
        Alert.alert("Error", "Gagal mengambil daftar kategori");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mengambil daftar kategori");
    }
  };

  // Handle input perubahan
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Reset error untuk field ini
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  // Handle reward slider change
  const handleRewardChange = (value) => {
    const roundedValue = Math.round(value / 10000) * 10000;
    setFormData({
      ...formData,
      reward: Math.max(0, Math.min(500000, roundedValue)),
    });
  };

  // Handle ambil gambar
  const handleImagePicker = async () => {
    try {
      const result = await imageService.pickImage();
      if (result) {
        setFormData({
          ...formData,
          image: result,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Gagal memilih gambar");
    }
  };

  // Handle ambil foto dengan kamera
  const handleTakePhoto = async () => {
    try {
      const result = await imageService.takePhoto();
      if (result) {
        setFormData({
          ...formData,
          image: result,
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Gagal mengambil foto");
    }
  };

  // Hapus gambar
  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: null,
    });
  };

  // Handle date picker change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        lostDate: selectedDate,
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = "Nama barang harus diisi";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Kategori harus dipilih";
    }

    if (!formData.lastSeenLocation.trim()) {
      newErrors.lastSeenLocation = "Lokasi terakhir harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      // Prepare form data for API
      const apiFormData = new FormData();

      // Add text fields
      apiFormData.append("item_name", formData.itemName);
      apiFormData.append("category_id", formData.categoryId);
      apiFormData.append("description", formData.description || "");
      apiFormData.append("last_seen_location", formData.lastSeenLocation);

      // Format the date as YYYY-MM-DD
      const dateString = formData.lostDate.toISOString().split("T")[0];
      apiFormData.append("lost_date", dateString);

      // Add reward if any
      if (formData.reward > 0) {
        apiFormData.append("reward", formData.reward.toString());
      }

      // Add image if any
      if (formData.image) {
        apiFormData.append("image", {
          uri: formData.image.uri,
          type: formData.image.type || "image/jpeg",
          name: formData.image.name || "lost_item.jpg",
        });
      }

      const response = await lostItemAPI.createLostItem(apiFormData, token);

      setIsSubmitting(false);

      if (response.success) {
        // Navigate to success screen
        navigation.navigate("ReportSuccess", {
          type: "lost",
          itemName: formData.itemName,
          itemId: response.data.id,
        });
      } else {
        Alert.alert(
          "Error",
          response.message || "Gagal melaporkan barang hilang"
        );
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error submitting lost item:", error);
      Alert.alert(
        "Error",
        "Terjadi kesalahan saat mengirim laporan barang hilang"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporkan Barang Hilang</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.formContainer}>
          {/* Nama Barang */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Barang*</Text>
            <TextInput
              style={[styles.input, errors.itemName && styles.inputError]}
              placeholder="Contoh: Dompet Hitam, Laptop ASUS, dll"
              value={formData.itemName}
              onChangeText={(text) => handleInputChange("itemName", text)}
            />
            {errors.itemName && (
              <Text style={styles.errorText}>{errors.itemName}</Text>
            )}
          </View>

          {/* Kategori */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori*</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.categoryId === category.id &&
                      styles.categorySelected,
                  ]}
                  onPress={() => handleInputChange("categoryId", category.id)}
                >
                  <Ionicons
                    name={category.icon || "help-circle"}
                    size={24}
                    color={
                      formData.categoryId === category.id
                        ? "#EF4444"
                        : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      formData.categoryId === category.id &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.categoryId && (
              <Text style={styles.errorText}>{errors.categoryId}</Text>
            )}
          </View>

          {/* Deskripsi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Deskripsi tambahan tentang barang (warna, ukuran, ciri khusus, dll)"
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Lokasi Terakhir */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lokasi Terakhir*</Text>
            <TextInput
              style={[
                styles.input,
                errors.lastSeenLocation && styles.inputError,
              ]}
              placeholder="Contoh: Perpustakaan UNY, Gedung FMIPA Lantai 2, dll"
              value={formData.lastSeenLocation}
              onChangeText={(text) =>
                handleInputChange("lastSeenLocation", text)
              }
            />
            {errors.lastSeenLocation && (
              <Text style={styles.errorText}>{errors.lastSeenLocation}</Text>
            )}
          </View>

          {/* Tanggal Hilang */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Hilang*</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.lostDate.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Ionicons name="calendar" size={24} color="#6B7280" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.lostDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Hadiah Temuan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hadiah Temuan (opsional)</Text>
            <Text style={styles.rewardValue}>
              {formData.reward > 0
                ? `Rp ${formData.reward.toLocaleString("id-ID")}`
                : "Tidak ada hadiah"}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={500000}
              step={10000}
              value={formData.reward}
              onValueChange={handleRewardChange}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#EF4444"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Rp 0</Text>
              <Text style={styles.sliderLabel}>Rp 500.000</Text>
            </View>
          </View>

          {/* Upload Gambar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Foto Barang (opsional)</Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePicker}
              >
                <Ionicons name="images" size={24} color="#EF4444" />
                <Text style={styles.uploadButtonText}>Galeri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={24} color="#EF4444" />
                <Text style={styles.uploadButtonText}>Kamera</Text>
              </TouchableOpacity>
            </View>
            {formData.image && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: formData.image.uri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Laporkan Barang Hilang
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#EF4444",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  categorySelected: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  categoryText: {
    marginLeft: 8,
    color: "#6B7280",
  },
  categoryTextSelected: {
    color: "#EF4444",
    fontWeight: "bold",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#374151",
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  uploadContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    flex: 1,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: "#EF4444",
    fontWeight: "bold",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imagePreview: {
    position: "relative",
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
