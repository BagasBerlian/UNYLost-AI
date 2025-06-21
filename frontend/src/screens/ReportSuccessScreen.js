// File: frontend/src/screens/ReportSuccessScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ReportSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, itemName, itemId } = route.params || {};

  const isLost = type === "lost";
  const mainColor = isLost ? "#EF4444" : "#3B82F6";

  const handleGoHome = () => {
    navigation.navigate("Dashboard");
  };

  const handleViewItem = () => {
    // Akan diimplementasikan nanti
    navigation.navigate("MyItems");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: mainColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Berhasil</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.successContainer}>
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: mainColor }]}>
            <Ionicons name="checkmark" size={64} color="white" />
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>Laporan Berhasil Dibuat!</Text>
          <Text style={styles.successMessage}>
            {isLost
              ? `Laporan barang hilang "${itemName}" telah berhasil dibuat. Kami akan mencarikan barang temuan yang cocok.`
              : `Laporan barang temuan "${itemName}" telah berhasil dibuat. Terima kasih atas kepedulian Anda.`}
          </Text>

          {/* Item ID */}
          <View style={styles.itemIdContainer}>
            <Text style={styles.itemIdLabel}>ID Laporan:</Text>
            <Text style={styles.itemId}>{itemId}</Text>
          </View>

          {/* What's Next */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Langkah Selanjutnya:</Text>
            <View style={styles.infoItem}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={mainColor}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Anda akan menerima notifikasi jika{" "}
                {isLost
                  ? "ada barang temuan yang cocok"
                  : "pemilik mengklaim barang ini"}
                .
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="list-outline"
                size={24}
                color={mainColor}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Anda dapat melihat dan mengelola laporan ini di menu "Barang
                Saya".
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="search-outline"
                size={24}
                color={mainColor}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                {isLost
                  ? "Kami akan mencari kecocokan otomatis dengan barang temuan."
                  : "Kami akan mencari kecocokan otomatis dengan barang hilang."}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: mainColor }]}
              onPress={handleViewItem}
            >
              <Ionicons name="list" size={20} color="white" />
              <Text style={styles.buttonText}>Lihat Barang Saya</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.outlineButton,
                { borderColor: mainColor },
              ]}
              onPress={handleGoHome}
            >
              <Ionicons name="home" size={20} color={mainColor} />
              <Text style={[styles.buttonText, { color: mainColor }]}>
                Kembali ke Beranda
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
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
  contentContainer: {
    padding: 16,
  },
  successContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  itemIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
  },
  itemIdLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginRight: 8,
  },
  itemId: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoContainer: {
    width: "100%",
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  actionButtons: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
});
