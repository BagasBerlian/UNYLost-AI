// File: frontend/src/screens/DashboardScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { foundItemAPI, lostItemAPI, categoryAPI } from "../services/api";
import BottomNavigation from "../components/BottomNavigation";
import ReportOptionsScreen from "./ReportOptionsScreen";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [recentFoundItems, setRecentFoundItems] = useState([]);
  const [recentLostItems, setRecentLostItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchRecentFoundItems(),
        fetchRecentLostItems(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Gagal memuat data dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await categoryAPI.getCategories(token);

      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchRecentFoundItems = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await foundItemAPI.getFoundItems(token, 5, 0);

      if (response.success) {
        setRecentFoundItems(response.data);
      }
    } catch (error) {
      console.error("Error fetching recent found items:", error);
    }
  };

  const fetchRecentLostItems = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await lostItemAPI.getLostItems(token, 5, 0);

      if (response.success) {
        setRecentLostItems(response.data);
      }
    } catch (error) {
      console.error("Error fetching recent lost items:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCategoryPress = (category) => {
    // TODO: Navigate to category items screen
    Alert.alert("Info", `Menampilkan barang kategori: ${category.name}`);
  };

  const handleItemPress = (item, type) => {
    // TODO: Navigate to item detail screen
    Alert.alert("Info", `Menampilkan detail barang ${type}: ${item.item_name}`);
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={item.icon || "help-circle"} size={24} color="#3B82F6" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderItemCard = ({ item, type }) => {
    const isLost = type === "lost";

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item, type)}
      >
        <View style={styles.itemImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholderImage,
                { backgroundColor: isLost ? "#FECACA" : "#BFDBFE" },
              ]}
            >
              <Ionicons
                name={isLost ? "search" : "basket"}
                size={24}
                color={isLost ? "#EF4444" : "#3B82F6"}
              />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.item_name}
          </Text>
          <Text style={styles.itemCategory} numberOfLines={1}>
            {item.category_name}
          </Text>
          <Text style={styles.itemLocation} numberOfLines={1}>
            {isLost ? item.last_seen_location : item.location}
          </Text>
          <Text style={styles.itemDate}>
            {new Date(
              isLost ? item.lost_date : item.found_date
            ).toLocaleDateString("id-ID")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Halo,</Text>
            <Text style={styles.headerName}>
              {user?.full_name || "Pengguna"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-circle" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Main Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.lostButton]}
            onPress={() => navigation.navigate("ReportLost")}
          >
            <Ionicons name="search" size={24} color="white" />
            <Text style={styles.actionButtonText}>Laporkan Hilang</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.foundButton]}
            onPress={() => navigation.navigate("ReportFound")}
          >
            <Ionicons name="basket" size={24} color="white" />
            <Text style={styles.actionButtonText}>Laporkan Temuan</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Kategori</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCategoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Recent Lost Items */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Barang Hilang Terbaru</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Info", "Lihat semua barang hilang")}
            >
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {recentLostItems.length > 0 ? (
            <FlatList
              data={recentLostItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderItemCard({ item, type: "lost" })}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="search"
                size={40}
                color="#EF4444"
                style={{ opacity: 0.5 }}
              />
              <Text style={styles.emptyStateText}>Belum ada barang hilang</Text>
            </View>
          )}
        </View>

        {/* Recent Found Items */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Barang Temuan Terbaru</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Info", "Lihat semua barang temuan")}
            >
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {recentFoundItems.length > 0 ? (
            <FlatList
              data={recentFoundItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => renderItemCard({ item, type: "found" })}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="basket"
                size={40}
                color="#3B82F6"
                style={{ opacity: 0.5 }}
              />
              <Text style={styles.emptyStateText}>Belum ada barang temuan</Text>
            </View>
          )}
        </View>

        {/* Bottom padding to avoid content being hidden by navigation */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Report Options Modal */}
      {showReportOptions && (
        <ReportOptionsScreen
          visible={showReportOptions}
          onClose={() => setShowReportOptions(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#3B82F6",
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerGreeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  lostButton: {
    backgroundColor: "#EF4444",
  },
  foundButton: {
    backgroundColor: "#3B82F6",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  seeAllText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  categoriesList: {
    paddingVertical: 12,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
  },
  itemsList: {
    paddingVertical: 12,
  },
  itemCard: {
    backgroundColor: "white",
    borderRadius: 12,
    width: 180,
    marginRight: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImageContainer: {
    height: 120,
    width: "100%",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    padding: 40,
    borderRadius: 12,
    marginVertical: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
});
