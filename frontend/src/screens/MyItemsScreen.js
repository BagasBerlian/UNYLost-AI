// File: frontend/src/screens/MyItemsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { foundItemAPI, lostItemAPI } from "../services/api";
import BottomNavigation from "../components/BottomNavigation";

export default function MyItemsScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState("lost");
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchLostItems(), fetchFoundItems()]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Gagal memuat data barang");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLostItems = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await lostItemAPI.getMyLostItems(token);

      if (response.success) {
        setLostItems(response.data);
      } else {
        console.error("Failed to fetch lost items:", response.message);
      }
    } catch (error) {
      console.error("Error fetching lost items:", error);
      throw error;
    }
  };

  const fetchFoundItems = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await foundItemAPI.getMyFoundItems(token);

      if (response.success) {
        setFoundItems(response.data);
      } else {
        console.error("Failed to fetch found items:", response.message);
      }
    } catch (error) {
      console.error("Error fetching found items:", error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleItemPress = (item, type) => {
    // Navigate to detail screen (akan diimplementasikan nanti)
    console.log(`View ${type} item:`, item.id);
    Alert.alert("Info", "Fitur detail barang akan segera tersedia");
  };

  const handleDeleteItem = async (item, type) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus ${
        type === "lost" ? "barang hilang" : "barang temuan"
      } ini?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const token = await AsyncStorage.getItem("userToken");

              let response;
              if (type === "lost") {
                response = await lostItemAPI.deleteLostItem(item.id, token);
              } else {
                response = await foundItemAPI.deleteFoundItem(item.id, token);
              }

              if (response.success) {
                if (type === "lost") {
                  setLostItems(lostItems.filter((i) => i.id !== item.id));
                } else {
                  setFoundItems(foundItems.filter((i) => i.id !== item.id));
                }
                Alert.alert("Sukses", "Barang berhasil dihapus");
              } else {
                Alert.alert(
                  "Error",
                  response.message || "Gagal menghapus barang"
                );
              }
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Terjadi kesalahan saat menghapus barang");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, type }) => {
    const isLost = type === "lost";
    const statusColor = isLost
      ? item.status === "found"
        ? "#10B981"
        : "#EF4444"
      : item.status === "claimed"
      ? "#10B981"
      : "#3B82F6";

    const statusText = isLost
      ? item.status === "found"
        ? "Ditemukan"
        : "Hilang"
      : item.status === "claimed"
      ? "Diklaim"
      : "Menunggu";

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item, type)}
      >
        <View style={styles.itemContent}>
          <View style={styles.imageContainer}>
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
                  size={30}
                  color={isLost ? "#EF4444" : "#3B82F6"}
                />
              </View>
            )}
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.item_name}
            </Text>
            <Text style={styles.itemCategory} numberOfLines={1}>
              {item.category_name}
            </Text>
            <Text style={styles.itemLocation} numberOfLines={1}>
              {isLost ? item.last_seen_location : item.location}
            </Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemDate}>
                {new Date(
                  isLost ? item.lost_date : item.found_date
                ).toLocaleDateString("id-ID")}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item, type)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = ({ type }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === "lost" ? "search" : "basket"}
        size={64}
        color={type === "lost" ? "#EF4444" : "#3B82F6"}
        style={{ opacity: 0.5 }}
      />
      <Text style={styles.emptyTitle}>
        Belum ada {type === "lost" ? "barang hilang" : "barang temuan"}
      </Text>
      <Text style={styles.emptyText}>
        {type === "lost"
          ? "Anda belum melaporkan barang hilang"
          : "Anda belum melaporkan barang temuan"}
      </Text>
      <TouchableOpacity
        style={[
          styles.reportButton,
          {
            backgroundColor: type === "lost" ? "#EF4444" : "#3B82F6",
          },
        ]}
        onPress={() =>
          navigation.navigate(type === "lost" ? "ReportLost" : "ReportFound")
        }
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.reportButtonText}>
          Laporkan {type === "lost" ? "Barang Hilang" : "Barang Temuan"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barang Saya</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "lost" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("lost")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "lost" && styles.activeTabText,
            ]}
          >
            Barang Hilang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "found" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("found")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "found" && styles.activeTabText,
            ]}
          >
            Barang Temuan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === "lost" ? lostItems : foundItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderItem({ item, type: activeTab })}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={<EmptyListComponent type={activeTab} />}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#3B82F6",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#3B82F6",
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
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
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
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
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
});
