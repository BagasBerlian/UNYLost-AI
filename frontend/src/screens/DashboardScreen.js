import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../services/api";
import BottomNavigation from "../components/BottomNavigation";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    foundItems: 0,
    lostItems: 0,
    matchedItems: 0,
    pendingClaims: 0,
  });

  useEffect(() => {
    fetchUserStatistics();
  }, []);

  const fetchUserStatistics = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getUserStatistics();

      if (response.success && response.data) {
        console.log("Dashboard data received:", response.data);
        // Pastikan data memiliki format yang benar
        setStats({
          foundItems: response.data.foundItems || 0,
          lostItems: response.data.lostItems || 0,
          matchedItems: response.data.matchedItems || 0,
          pendingClaims: response.data.pendingClaims || 0,
        });
      } else {
        console.error("Error fetching statistics:", response.message);
        // Fallback ke data dummy jika gagal
        setStats({
          foundItems: 0,
          lostItems: 0,
          matchedItems: 0,
          pendingClaims: 0,
        });

        // Hanya tampilkan alert pada development
        if (__DEV__) {
          Alert.alert(
            "Error Fetching Statistics",
            `${response.message || "Unknown error"}. Using default values.`,
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("Error in fetchUserStatistics:", error);
      // Fallback ke data dummy
      setStats({
        foundItems: 0,
        lostItems: 0,
        matchedItems: 0,
        pendingClaims: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Ekstrak nama depan dari full_name
  const firstName = user?.full_name?.split(" ")[0] || "Pengguna";

  // Fungsi untuk menangani navigasi menu
  const handleReportFound = () => navigation.navigate("ReportFound");
  const handleReportLost = () => navigation.navigate("ReportLost");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>UNY LOST APP</Text>
          <Text style={styles.headerSubtitle}>Halo, {firstName}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Utama */}
        <Text style={styles.sectionTitle}>Apa yang ingin kamu lakukan?</Text>

        {/* Menu Item - Lapor Temuan */}
        <TouchableOpacity style={styles.menuItem} onPress={handleReportFound}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Saya Menemukan Barang</Text>
            <Text style={styles.menuSubtitle}>
              Laporkan barang yang kamu temukan
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C5C5C7" />
        </TouchableOpacity>

        {/* Menu Item - Lapor Kehilangan */}
        <TouchableOpacity style={styles.menuItem} onPress={handleReportLost}>
          <View style={[styles.menuIconContainer, styles.iconLost]}>
            <Ionicons name="close-circle" size={24} color="#F44336" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Saya Kehilangan Barang</Text>
            <Text style={styles.menuSubtitle}>
              Laporkan barang yang kamu hilangkan
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C5C5C7" />
        </TouchableOpacity>

        {/* Statistik */}
        <Text style={styles.sectionTitle}>STATISTIK SAYA</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3478F6"
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.statsContainer}>
            {/* Statistik Barang Temuan */}
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statLabel}>Barang Temuan</Text>
              <Text style={styles.statValue}>{stats.foundItems}</Text>
            </View>

            {/* Statistik Barang Hilang */}
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, styles.iconLost]}>
                <Ionicons name="close" size={24} color="#F44336" />
              </View>
              <Text style={styles.statLabel}>Barang Hilang</Text>
              <Text style={styles.statValue}>{stats.lostItems}</Text>
            </View>

            {/* Statistik Match */}
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, styles.iconMatch]}>
                <Ionicons name="flash" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statLabel}>Match Ditemukan</Text>
              <Text style={styles.statValue}>{stats.matchedItems}</Text>
            </View>

            {/* Statistik Review */}
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, styles.iconPending]}>
                <Ionicons name="time" size={24} color="#FFC107" />
              </View>
              <Text style={styles.statLabel}>Menunggu Review</Text>
              <Text style={styles.statValue}>{stats.pendingClaims}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconLost: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconMatch: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  iconPending: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
});
