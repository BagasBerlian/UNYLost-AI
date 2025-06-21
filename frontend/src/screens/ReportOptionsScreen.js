// File: frontend/src/screens/ReportOptionsScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ReportOptionsScreen({ visible, onClose }) {
  const navigation = useNavigation();

  const handleReportLost = () => {
    onClose();
    navigation.navigate("ReportLost");
  };

  const handleReportFound = () => {
    onClose();
    navigation.navigate("ReportFound");
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Laporkan Barang</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.optionButton, styles.lostButton]}
            onPress={handleReportLost}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="search" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Laporkan Barang Hilang</Text>
              <Text style={styles.optionDescription}>
                Kehilangan barang? Laporkan agar orang lain dapat membantu
                menemukan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, styles.foundButton]}
            onPress={handleReportFound}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#3B82F6" }]}
            >
              <Ionicons name="basket" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Laporkan Barang Temuan</Text>
              <Text style={styles.optionDescription}>
                Menemukan barang? Laporkan agar pemiliknya dapat mengklaim
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  closeButton: {
    padding: 4,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  lostButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  foundButton: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
});
