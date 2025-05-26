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
  FlatList,
  SafeAreaView,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
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

interface ImageAsset {
  uri: string;
  fileName?: string;
  type?: string;
}

export default function ReportFoundScreen() {
  const { userToken } = useContext(AuthContext);
  const [itemName, setItemName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [locationFound, setLocationFound] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(
    new Date()
  );

  const [images, setImages] = useState<ImageAsset[]>([]);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

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

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert("Maksimal 5 Gambar", "Anda sudah memilih 5 gambar.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets) {
      const newAssets: ImageAsset[] = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName:
          asset.fileName || `photo_${Date.now()}.${asset.uri.split(".").pop()}`,
        type: asset.type || "image/jpeg",
      }));
      setImages((prevImages) => [...prevImages, ...newAssets].slice(0, 5));
    }
  };

  const removeImage = (uriToRemove: string) => {
    setImages((prevImages) =>
      prevImages.filter((img) => img.uri !== uriToRemove)
    );
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

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
      !locationFound ||
      !selectedDate ||
      !selectedTime ||
      images.length === 0
    ) {
      setFormError("Semua field wajib diisi, dan minimal 1 gambar.");
      return;
    }

    setLoading(true);

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
    formData.append("location", locationFound);
    formData.append("found_date", combinedDateTime.toISOString().split("T")[0]);

    images.forEach((img, index) => {
      formData.append("files", {
        uri: img.uri,
        name: img.fileName || `photo_${index}.jpg`,
        type: img.type || "image/jpeg",
      } as any);
    });

    try {
      const response = await axios.post(`${API_URL}/found-items`, formData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("Sukses", `Laporan penemuan berhasil dikirim!`);
      // console.log(JSON.stringify(response));
      // router.back();
    } catch (error: any) {
      console.error(
        "Failed to submit found item report:",
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
        <Text style={styles.headerTitle}>Lapor Penemuan Barang</Text>
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
          textColor="#000"
          onChangeText={setItemName}
          placeholder="Contoh: Kunci Motor Honda Vario"
          outlineColor={PRIMARY_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          theme={{ colors: { primary: PRIMARY_COLOR, background: "#fff" } }}
        />

        <Text style={styles.label}>Foto Barang (Maks. 5 Foto)</Text>
        <FlatList
          data={[
            { id: "add" },
            ...images.map((img) => ({ id: img.uri, ...img })),
          ]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          style={styles.imageList}
          renderItem={({ item }) => {
            if (item.id === "add") {
              return (
                images.length < 5 && (
                  <TouchableOpacity
                    style={styles.imagePickerSquare}
                    onPress={pickImages}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={30}
                      color={PRIMARY_COLOR}
                    />
                    <Text style={styles.addImageText}>Tambah Foto</Text>
                  </TouchableOpacity>
                )
              );
            }
            return (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.imagePreviewSquare}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(item.uri)}
                >
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
        {images.length === 0 && (
          <TouchableOpacity
            style={styles.imagePickerLarge}
            onPress={pickImages}
          >
            <Ionicons name="camera-outline" size={40} color={PRIMARY_COLOR} />
            <Text style={styles.imagePickerText}>Pilih Gambar (Minimal 1)</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
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
          textColor="#000"
          onChangeText={setDescription}
          placeholder="Deskripsikan ciri-ciri barang, kondisi, dll."
          multiline
          numberOfLines={4}
          outlineColor={PRIMARY_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          theme={{ colors: { primary: PRIMARY_COLOR, background: "#fff" } }}
        />

        {/* Input Lokasi Penemuan */}
        <Text style={styles.label}>Lokasi Penemuan</Text>
        <TextInput
          mode="outlined"
          style={styles.input}
          value={locationFound}
          textColor="#000"
          onChangeText={setLocationFound}
          placeholder="Contoh: Perpustakaan Pusat UNY Lantai 2"
          outlineColor={PRIMARY_COLOR}
          activeOutlineColor={PRIMARY_COLOR}
          theme={{ colors: { primary: PRIMARY_COLOR, background: "#fff" } }}
        />

        <Text style={styles.label}>Tanggal & Waktu Penemuan</Text>
        {/* ... (Input Tanggal dan Waktu tetap sama) ... */}
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
          locale="id-ID"
        />

        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={hideTimePicker}
          date={selectedTime || new Date()}
          locale="id-ID"
          is24Hour
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
          theme={{ colors: { primary: PRIMARY_COLOR } }}
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
    backgroundColor: "#fff",
  },
  headerBar: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: Platform.OS === "android" ? 30 : 45,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexGrow: 1,
  },
  label: {
    fontSize: 15,
    color: "#424242",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  imagePickerLarge: {
    height: 120,
    width: "100%",
    backgroundColor: "#F5F8FA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderStyle: "dashed",
  },
  imagePickerText: {
    marginTop: 10,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  imageList: {
    marginBottom: 18,
    height: 110,
  },
  imagePickerSquare: {
    width: 100,
    height: 100,
    backgroundColor: "#F5F8FA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginTop: 4,
    textAlign: "center",
  },
  imagePreviewContainer: {
    position: "relative",
    marginRight: 10,
    width: 100,
    height: 100,
  },
  imagePreviewSquare: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#B0B0B0",
    borderRadius: 4,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: Platform.OS === "ios" ? 120 : 50,
    width: "100%",
    color: "#000",
  },
  pickerItem: {
    color: "#000",
  },
  pickerItemPlaceholder: {
    color: "#9E9E9E",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  dateTimePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  dateButton: {
    marginRight: 5,
  },
  timeButton: {
    marginLeft: 5,
  },
  dateTimePickerText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    marginTop: 25,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 17,
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
