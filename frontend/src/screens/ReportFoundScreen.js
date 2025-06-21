import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { foundItemAPI } from "../services/api";
import { categoryAPI } from "../services/api";
import imageService from "../services/imageService";

export default function ReportFoundScreen() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    categoryId: null,
    location: "",
    foundDate: new Date(),
    images: [],
  });

  const [categories, setCategories] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Handle pilih gambar dari galeri
  const handlePickImage = async () => {
    try {
      const result = await imageService.pickImage();
      if (result) {
        setFormData({
          ...formData,
          images: [...formData.images, result],
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
          images: [...formData.images, result],
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Gagal mengambil foto");
    }
  };

  // Hapus gambar dari daftar
  const handleRemoveImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      images: updatedImages,
    });
  };

  // Handle date picker change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        foundDate: selectedDate,
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

    if (!formData.location.trim()) {
      newErrors.location = "Lokasi ditemukan harus diisi";
    }

    if (formData.images.length === 0) {
      newErrors.images = "Minimal satu foto harus diupload";
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
      apiFormData.append("location", formData.location);

      // Format the date as YYYY-MM-DD
      const dateString = formData.foundDate.toISOString().split("T")[0];
      apiFormData.append("found_date", dateString);

      // Add images
      formData.images.forEach((image, index) => {
        apiFormData.append("images", {
          uri: image.uri,
          type: image.type || "image/jpeg",
          name: image.name || `image_${index}.jpg`,
        });
      });

      const response = await foundItemAPI.createFoundItem(apiFormData, token);

      setIsSubmitting(false);

      if (response.success) {
        // Navigate to success screen
        navigation.navigate("ReportSuccess", {
          type: "found",
          itemName: formData.itemName,
          itemId: response.data.id,
        });
      } else {
        Alert.alert(
          "Error",
          response.message || "Gagal melaporkan barang temuan"
        );
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error submitting found item:", error);
      Alert.alert(
        "Error",
        "Terjadi kesalahan saat mengirim laporan barang temuan"
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
        <Text style={styles.headerTitle}>Laporkan Barang Temuan</Text>
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
                        ? "#3B82F6"
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

          {/* Lokasi Ditemukan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lokasi Ditemukan*</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Contoh: Perpustakaan UNY, Gedung FMIPA Lantai 2, dll"
              value={formData.location}
              onChangeText={(text) => handleInputChange("location", text)}
            />
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
          </View>

          {/* Tanggal Ditemukan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Ditemukan*</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.foundDate.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Ionicons name="calendar" size={24} color="#6B7280" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.foundDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Upload Gambar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Foto Barang*</Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickImage}
              >
                <Ionicons name="images" size={24} color="#3B82F6" />
                <Text style={styles.uploadButtonText}>Galeri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={24} color="#3B82F6" />
                <Text style={styles.uploadButtonText}>Kamera</Text>
              </TouchableOpacity>
            </View>
            {errors.images && (
              <Text style={styles.errorText}>{errors.images}</Text>
            )}
            {formData.images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {formData.images.map((image, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
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
                Laporkan Barang Temuan
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
    backgroundColor: "#3B82F6",
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
    borderColor: "#3B82F6",
    backgroundColor: "#EBF5FF",
  },
  categoryText: {
    marginLeft: 8,
    color: "#6B7280",
  },
  categoryTextSelected: {
    color: "#3B82F6",
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
  uploadContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EBF5FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    flex: 1,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: "#3B82F6",
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
    backgroundColor: "#3B82F6",
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
