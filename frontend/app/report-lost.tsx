import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import { TextInput, Button } from "react-native-paper"; // ActivityIndicator tidak digunakan lagi di contoh ini
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

const API_URL = "http://localhost:5000/api";
const PRIMARY_COLOR = "#1d61e7";

interface Category {
  id: number;
  name: string;
}

export default function ReportLostScreen() {
  const { userToken } = useContext(AuthContext);
  const [itemName, setItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");

  // State terpisah untuk tanggal dan waktu
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(
    new Date()
  ); // Inisialisasi dengan waktu sekarang juga

  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false); // State untuk time picker

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        Alert.alert("Error", "Gagal memuat kategori.");
      }
    };
    if (userToken) {
      fetchCategories();
    }
  }, [userToken]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setImageFile(result.assets[0]);
    }
  };

  // Fungsi untuk Date Picker
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  // Fungsi untuk Time Picker
  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);
  const handleConfirmTime = (time: Date) => {
    setSelectedTime(time);
    hideTimePicker();
  };

  const handleSubmit = async () => {
    setFormError("");
    if (
      !itemName ||
      !selectedCategory ||
      !description ||
      !selectedDate || // Menggunakan selectedDate
      !selectedTime || // Menggunakan selectedTime
      !imageFile
    ) {
      setFormError(
        "Semua field wajib diisi, termasuk gambar, tanggal, dan waktu."
      );
      return;
    }

    setLoading(true);

    // Gabungkan tanggal dan waktu menjadi satu objek Date
    const combinedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      selectedTime.getSeconds()
    );

    const formData = new FormData();
    formData.append("item_name", itemName);
    formData.append("category_id", selectedCategory.toString());
    formData.append("description", description);
    formData.append("last_seen_location", "Lokasi Belum Diinput Detail");
    formData.append("lost_date", combinedDateTime.toISOString().split("T")[0]); // Kirim hanya tanggal YYYY-MM-DD
    // Jika backend memerlukan full ISO string: formData.append("lost_date", combinedDateTime.toISOString());

    const uriParts = imageFile.uri.split(".");
    const fileType = uriParts[uriParts.length - 1];

    formData.append("image", {
      uri: imageFile.uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    try {
      const response = await axios.post(`${API_URL}/lost-items`, formData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("Sukses", "Laporan kehilangan berhasil dikirim!");
      router.back();
    } catch (error: any) {
      console.error(
        "Failed to submit lost item report:",
        error.response?.data || error.message
      );
      setFormError(error.response?.data?.message || "Gagal mengirim laporan.");
      Alert.alert(
        "Error",
        "Gagal mengirim laporan. " + (error.response?.data?.message || "")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lapor Kehilangan Barang</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Nama Barang</Text>
        <TextInput
          mode="outlined"
          style={styles.input}
          value={itemName}
          onChangeText={setItemName}
          placeholder="Contoh: Dompet Kulit Hitam"
          outlineColor={PRIMARY_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          theme={{ colors: { primary: PRIMARY_COLOR, background: "#fff" } }}
        />

        <Text style={styles.label}>Foto Barang (1 Foto)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color={PRIMARY_COLOR} />
              <Text style={styles.imagePickerText}>Pilih Gambar</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem} // Untuk iOS
          >
            <Picker.Item
              label="-- Pilih Kategori --"
              value={undefined}
              style={styles.pickerItemPlaceholder}
            />
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Deskripsi Barang</Text>
        <TextInput
          mode="outlined"
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Deskripsikan ciri-ciri barang, lokasi terakhir terlihat, dll."
          multiline
          numberOfLines={4}
          outlineColor={PRIMARY_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          theme={{ colors: { primary: PRIMARY_COLOR, background: "#fff" } }}
        />

        <Text style={styles.label}>Tanggal & Waktu Kehilangan</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            onPress={showDatePicker}
            style={[styles.dateTimePickerButton, styles.dateButton]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={PRIMARY_COLOR}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.dateTimePickerText}>
              {selectedDate
                ? selectedDate.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Pilih Tanggal"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={showTimePicker}
            style={[styles.dateTimePickerButton, styles.timeButton]}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={PRIMARY_COLOR}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.dateTimePickerText}>
              {selectedTime
                ? selectedTime.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Pilih Waktu"}
            </Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          date={selectedDate || new Date()}
          locale="id-ID" // Untuk bahasa Indonesia jika didukung
          // headerTextIOS="Pilih Tanggal"
        />

        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={hideTimePicker}
          date={selectedTime || new Date()} // Inisialisasi dengan waktu saat ini
          locale="id-ID"
          // headerTextIOS="Pilih Waktu"
          is24Hour // Gunakan format 24 jam
        />

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          labelStyle={styles.submitButtonText}
          disabled={loading}
          loading={loading}
          icon="send"
          theme={{ colors: { primary: PRIMARY_COLOR } }} // Pastikan tema diterapkan untuk warna tombol
        >
          Kirim Laporan
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Latar belakang putih untuk keseluruhan halaman
  },
  headerBar: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: Platform.OS === "android" ? 30 : 45, // Sesuaikan padding atas
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // Garis tipis di bawah header
    elevation: 3, // Shadow untuk Android
  },
  backButton: {
    marginRight: 15,
    padding: 5, // Area sentuh lebih besar
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15, // Beri sedikit padding vertikal
    flexGrow: 1, // Agar bisa scroll
  },
  label: {
    fontSize: 15, // Sedikit kecilkan label
    color: "#424242", // Warna label lebih soft
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    marginBottom: 18, // Jarak antar input
    backgroundColor: "#FFFFFF", // Latar belakang input putih
    fontSize: 16,
  },
  textArea: {
    height: 120, // Area teks lebih tinggi
    textAlignVertical: "top",
    paddingTop: 10, // Padding atas untuk teks di textarea
  },
  imagePicker: {
    height: 180, // Picker gambar lebih tinggi
    width: "100%",
    backgroundColor: "#F5F8FA", // Warna placeholder gambar
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePickerText: {
    marginTop: 10,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8, // Sesuaikan dengan border radius picker
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#B0B0B0", // Warna border lebih jelas
    borderRadius: 4,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: Platform.OS === "ios" ? 120 : 50, // Tinggi berbeda untuk iOS agar opsi terlihat
    width: "100%",
    color: "#000", // Warna teks picker
  },
  pickerItem: {
    // Untuk iOS
    color: "#000",
  },
  pickerItemPlaceholder: {
    // Untuk iOS
    color: "#9E9E9E",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Beri jarak antar tombol tanggal dan waktu
    marginBottom: 18,
  },
  dateTimePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // Padding vertikal
    paddingHorizontal: 15, // Padding horizontal
    borderWidth: 1,
    borderColor: "#B0B0B0",
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    flex: 1, // Agar kedua tombol berbagi ruang
  },
  dateButton: {
    marginRight: 5, // Jarak antara tombol tanggal dan waktu
  },
  timeButton: {
    marginLeft: 5, // Jarak antara tombol tanggal dan waktu
  },
  dateTimePickerText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    marginTop: 25,
    paddingVertical: 10, // Padding tombol lebih besar
    borderRadius: 8, // Radius tombol
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 17, // Font tombol lebih besar
    fontWeight: "bold",
    color: "#fff",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
});
