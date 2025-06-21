// File: frontend/src/components/BottomNavigation.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function BottomNavigation() {
  const navigation = useNavigation();

  const navigateTo = (screenName) => {
    navigation.navigate(screenName);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateTo("Dashboard")}
      >
        <Ionicons name="home" size={24} color="#3B82F6" />
        <Text style={styles.tabLabel}>Beranda</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateTo("MyItems")}
      >
        <Ionicons name="list" size={24} color="#6B7280" />
        <Text style={styles.tabLabel}>Barang Saya</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => {
          // Tampilkan menu untuk memilih jenis laporan
          navigation.navigate("ReportOptions");
        }}
      >
        <Ionicons name="add-circle" size={56} color="#3B82F6" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateTo("Notifications")}
      >
        <Ionicons name="notifications" size={24} color="#6B7280" />
        <Text style={styles.tabLabel}>Notifikasi</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigateTo("Profile")}
      >
        <Ionicons name="person" size={24} color="#6B7280" />
        <Text style={styles.tabLabel}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: "#6B7280",
  },
  mainButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
  },
});
