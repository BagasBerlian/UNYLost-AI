// frontend/app/(tabs)/laporan.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function LaporanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Laporan Anda</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Laporan</Text>
        <Text>Anda bisa check semua data laporan anda disini</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1E88E5",
    padding: 20,
    paddingTop: 40,
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
