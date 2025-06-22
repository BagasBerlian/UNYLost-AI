import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ReportOptionsScreen from "../screens/ReportOptionsScreen";

export default function BottomNavigation() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentScreen = route.name;

  const [showReportOptions, setShowReportOptions] = useState(false);

  const handleNavigation = (item) => {
    if (item.name === "ReportOptions") {
      setShowReportOptions(true);
    } else {
      navigation.navigate(item.name);
    }
  };

  const handleCloseReportOptions = () => {
    setShowReportOptions(false);
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: "home-outline",
      activeIcon: "home",
      label: "Beranda",
    },
    {
      name: "MyItems",
      icon: "cube-outline",
      activeIcon: "cube",
      label: "Item Saya",
    },
    {
      name: "ReportOptions",
      icon: "add",
      activeIcon: "add",
      label: "",
      isCenter: true,
    },
    {
      name: "Notifications",
      icon: "notifications-outline",
      activeIcon: "notifications",
      label: "Notif",
    },
    {
      name: "Profile",
      icon: "person-outline",
      activeIcon: "person",
      label: "Profil",
    },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.navItem, item.isCenter && styles.centerButton]}
          onPress={() => handleNavigation(item)}
        >
          {item.isCenter ? (
            <View style={styles.addButtonInner}>
              <Ionicons name={item.icon} size={24} color="#FFF" />
            </View>
          ) : (
            <>
              <Ionicons
                name={currentScreen === item.name ? item.activeIcon : item.icon}
                size={24}
                color={currentScreen === item.name ? "#3478F6" : "#888"}
              />
              <Text
                style={[
                  styles.navLabel,
                  currentScreen === item.name && styles.activeNavLabel,
                ]}
              >
                {item.label}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ))}
      <ReportOptionsScreen
        visible={showReportOptions}
        onClose={handleCloseReportOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 80,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  centerButton: {
    justifyContent: "flex-start",
    marginTop: -30,
  },
  addButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3478F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  activeNavLabel: {
    color: "#3478F6",
  },
});
