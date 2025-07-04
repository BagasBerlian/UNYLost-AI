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
import { foundItemAPI, lostItemAPI, claimsAPI } from "../services/api"; // Correct import
import BottomNavigation from "../components/BottomNavigation";

export default function MyItemsScreen() {
  const navigation = useNavigation();

  // State untuk tab aktif (temuan, hilang, klaim)
  const [activeTab, setActiveTab] = useState("temuan");
  const [foundItems, setFoundItems] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [claimItems, setClaimItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFoundItems(),
        fetchLostItems(),
        fetchClaimItems(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Gagal memuat data barang");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoundItems = async () => {
    try {
      const response = await foundItemAPI.getMyItems(); // Correct usage

      if (response.success) {
        setFoundItems(response.data.items || response.data);
      } else {
        console.error("Failed to fetch found items:", response.message);
      }
    } catch (error) {
      console.error("Error fetching found items:", error);
      throw error;
    }
  };

  const fetchLostItems = async () => {
    try {
      const response = await lostItemAPI.getMyItems(); // Correct usage

      if (response.success) {
        setLostItems(response.data.items || response.data);
      } else {
        console.error("Failed to fetch lost items:", response.message);
      }
    } catch (error) {
      console.error("Error fetching lost items:", error);
      throw error;
    }
  };

  const fetchClaimItems = async () => {
    try {
      const response = await claimsAPI.getMyClaims();

      if (response.success) {
        setClaimItems(response.data.claims || response.data);
      } else {
        console.error("Failed to fetch claim items:", response.message);
      }
    } catch (error) {
      console.error("Error fetching claim items:", error);
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
    if (type === "temuan") {
      navigation.navigate("FoundItemDetail", { itemId: item.id });
    } else if (type === "hilang") {
      navigation.navigate("LostItemDetail", { itemId: item.id });
    } else if (type === "klaim") {
      navigation.navigate("ClaimDetail", { claimId: item.id });
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`;
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} menit yang lalu`;
    } else {
      return "Baru saja";
    }
  };

  const renderTemuanItem = ({ item }) => {
    const timeAgo = formatTimeAgo(item.created_at || item.createdAt);
    const matchCount = item.matches_count || 0;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item, "temuan")}
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
              <View style={styles.placeholderImage}>
                <Text>Foto {item.item_name || "Barang"}</Text>
              </View>
            )}
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>
              {item.item_name || "Barang Temuan"}
            </Text>
            <View style={styles.matchContainer}>
              <Ionicons name="people-outline" size={16} color="#3B82F6" />
              <Text style={styles.matchText}>{matchCount} Matches</Text>
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.itemDate}>{timeAgo}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Lihat matches</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHilangItem = ({ item }) => {
    const timeAgo = formatTimeAgo(item.created_at || item.createdAt);
    const matchCount = item.matches_count || 0;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item, "hilang")}
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
              <View style={styles.placeholderImage}>
                <Text>Foto {item.item_name || "Barang"}</Text>
              </View>
            )}
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>
              {item.item_name || "Barang Hilang"}
            </Text>
            {item.status === "active" ? (
              <View style={styles.statusContainer}>
                <Ionicons name="time-outline" size={16} color="#F59E0B" />
                <Text style={[styles.statusText, { color: "#F59E0B" }]}>
                  Belum ada klaim
                </Text>
              </View>
            ) : item.status === "found" ? (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.statusText, { color: "#10B981" }]}>
                  1 Klaim
                </Text>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={[styles.statusText, { color: "#EF4444" }]}>
                  Ditolak
                </Text>
              </View>
            )}
            <View style={styles.itemFooter}>
              <Text style={styles.itemDate}>{timeAgo}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Review Klaim</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderKlaimItem = ({ item }) => {
    const timeAgo = formatTimeAgo(item.created_at || item.createdAt);
    let statusIcon, statusColor, statusText;

    if (item.status === "pending") {
      statusIcon = "time-outline";
      statusColor = "#F59E0B";
      statusText = "Pending";
    } else if (item.status === "approved") {
      statusIcon = "checkmark-circle";
      statusColor = "#10B981";
      statusText = "Approved";
    } else {
      statusIcon = "close-circle";
      statusColor = "#EF4444";
      statusText = "Rejected";
    }

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item, "klaim")}
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
              <View style={styles.placeholderImage}>
                <Text>Foto {item.item_name || "Barang"}</Text>
              </View>
            )}
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>
              {item.item_name || "Laptop Asus"}
            </Text>
            <View style={styles.statusContainer}>
              <Ionicons name={statusIcon} size={16} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.itemDate}>{timeAgo}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Review Barang</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Komponen untuk daftar kosong
  const EmptyListComponent = ({ type }) => {
    let message, buttonText, iconName;

    if (type === "temuan") {
      message = "Anda belum pernah melaporkan barang temuan";
      buttonText = "Laporkan Barang Temuan";
      iconName = "add-circle";
    } else if (type === "hilang") {
      message = "Anda belum pernah melaporkan barang hilang";
      buttonText = "Laporkan Barang Hilang";
      iconName = "search";
    } else {
      message = "Anda belum pernah mengajukan klaim";
      buttonText = "Cari Barang Hilang";
      iconName = "search";
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Tidak ada data</Text>
        <Text style={styles.emptyText}>{message}</Text>
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: "#3B82F6" }]}
          onPress={() => {
            if (type === "temuan") {
              navigation.navigate("ReportFound");
            } else if (type === "hilang") {
              navigation.navigate("ReportLost");
            } else {
              navigation.navigate("Dashboard");
            }
          }}
        >
          <Ionicons name={iconName} size={20} color="white" />
          <Text style={styles.reportButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Fungsi untuk merender item berdasarkan tab aktif
  const renderItem = ({ item }) => {
    if (activeTab === "temuan") {
      return renderTemuanItem({ item });
    } else if (activeTab === "hilang") {
      return renderHilangItem({ item });
    } else {
      return renderKlaimItem({ item });
    }
  };

  // Data yang ditampilkan berdasarkan tab aktif
  const getActiveData = () => {
    if (activeTab === "temuan") {
      return foundItems;
    } else if (activeTab === "hilang") {
      return lostItems;
    } else {
      return claimItems;
    }
  };

  // Mendapatkan jumlah item untuk badge di tab
  const getCountBadge = (tab) => {
    if (tab === "temuan") {
      return foundItems.length;
    } else if (tab === "hilang") {
      return lostItems.length;
    } else {
      return claimItems.length;
    }
  };

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
        <Text style={styles.headerTitle}>Item Saya</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "temuan" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("temuan")}
        >
          <View style={styles.tabLabelContainer}>
            <Text
              style={[
                styles.tabText,
                activeTab === "temuan" && styles.activeTabText,
              ]}
            >
              Temuan
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{getCountBadge("temuan")}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "hilang" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("hilang")}
        >
          <View style={styles.tabLabelContainer}>
            <Text
              style={[
                styles.tabText,
                activeTab === "hilang" && styles.activeTabText,
              ]}
            >
              Hilang
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{getCountBadge("hilang")}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "klaim" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("klaim")}
        >
          <View style={styles.tabLabelContainer}>
            <Text
              style={[
                styles.tabText,
                activeTab === "klaim" && styles.activeTabText,
              ]}
            >
              Klaim Saya
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{getCountBadge("klaim")}</Text>
            </View>
          </View>
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
          data={getActiveData()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
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
  tabLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#3B82F6",
  },
  badgeContainer: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#F3F4F6",
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
    padding: 4,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  matchText: {
    fontSize: 14,
    color: "#3B82F6",
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 4,
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
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
    marginRight: 4,
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
