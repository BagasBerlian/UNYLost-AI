import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";

export default function ProfileScreen() {
  const { userData, logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Profile Screen</Text>

        {userData ? (
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.full_name}</Text>
            <Text style={styles.profileEmail}>{userData.email}</Text>
            <Text style={styles.profilePhone}>{userData.phone_number}</Text>
          </View>
        ) : (
          <Text>Loading profile information...</Text>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  profileInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  profilePhone: {
    fontSize: 16,
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
