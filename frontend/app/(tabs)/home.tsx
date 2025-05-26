import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HomeScreen() {
  const handleLaporanKehilangan = () => {
    router.push("/report-lost");
  };

  const handleLaporanPenemuan = () => {
    router.push("/report-found");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>UNYLost</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Selamat Datang!</Text>
          <Text style={styles.subtitle}>
            Temukan atau laporkan barang hilang & temuan di sekitar kampus UNY.
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, styles.kehilanganCard]}
            onPress={handleLaporanKehilangan}
          >
            <Ionicons name="search-sharp" size={40} color="#FFFFFF" />
            <Text style={styles.cardTitle}>Lapor Kehilangan</Text>
            <Text style={styles.cardDescription}>
              Buat laporan jika Anda kehilangan barang.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.penemuanCard]}
            onPress={handleLaporanPenemuan}
          >
            <Ionicons name="archive-sharp" size={40} color="#FFFFFF" />
            <Text style={styles.cardTitle}>Lapor Penemuan</Text>
            <Text style={styles.cardDescription}>
              Laporkan jika Anda menemukan barang.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  header: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.select({
      ios: 40,
      android: 25,
      default: 20,
    }),
    alignItems: "flex-start",
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    borderRadius: 15,
    padding: 25,
    width: "95%",
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  kehilanganCard: {
    backgroundColor: "#FF7675",
  },
  penemuanCard: {
    backgroundColor: "#55c9af",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#F0F0F0",
    textAlign: "center",
    lineHeight: 20,
  },
});
