import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ReportSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Get params
  const { type, itemId, reportId } = route.params || {
    type: "found",
    itemId: null,
    reportId: "UNY2023051",
  };

  const handleViewMyItems = () => {
    navigation.navigate("MyItems");
  };

  const handleBackToDashboard = () => {
    navigation.navigate("Dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark" size={48} color="white" />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Laporan Berhasil!</Text>

        <Text style={styles.message}>
          Terima kasih telah menggunakan{" "}
          <Text style={styles.appName}>UNYLost</Text>. Laporan Anda telah
          berhasil dikirim dan sedang diproses.
        </Text>

        {/* Auto-matching Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#3478F6" />
            <Text style={styles.infoTitle}>Pencocokan Otomatis</Text>
          </View>
          <Text style={styles.infoText}>
            Sistem kami akan mencocokkan laporan Anda dengan laporan lain yang
            relevan. Cek hasil pencocokan di menu "Barang Saya".
          </Text>
        </View>

        {/* Next Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Langkah Selanjutnya:</Text>

          <View style={styles.stepItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.stepText}>
              Anda akan menerima notifikasi jika ada kecocokan
            </Text>
          </View>

          <View style={styles.stepItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.stepText}>
              Pantau status laporan Anda di menu "Barang Saya"
            </Text>
          </View>

          <View style={styles.stepItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.stepText}>
              Jika ada kecocokan, Anda dapat menghubungi pihak terkait
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewMyItems}
        >
          <Text style={styles.primaryButtonText}>Lihat Barang Saya</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToDashboard}
        >
          <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>

        {/* Report ID */}
        <Text style={styles.reportId}>ID Laporan: {reportId}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  appName: {
    fontWeight: "bold",
    color: "#3478F6",
  },
  infoBox: {
    backgroundColor: "#E8F1FF",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3478F6",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#3478F6",
    lineHeight: 20,
  },
  stepsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#3478F6",
    borderRadius: 12,
    height: 56,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    height: 56,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: "#3478F6",
    fontSize: 16,
    fontWeight: "500",
  },
  reportId: {
    fontSize: 12,
    color: "#8E8E93",
  },
});
