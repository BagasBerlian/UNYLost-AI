import React, { useContext } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import CustomButton from "../../components/CustomButton";

const HomeScreen = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>Selamat Datang!</Text>
        <Text style={styles.name}>{user?.full_name}</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Ini adalah layar beranda aplikasi UNYLost. Di sini nantinya akan
            ditampilkan daftar laporan barang hilang dan temuan.
          </Text>
        </View>

        <View style={styles.logoutContainer}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            type="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  name: {
    fontSize: 18,
    color: "#007BFF",
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: "#F0F7FF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  logoutContainer: {
    marginTop: "auto",
  },
});

export default HomeScreen;
