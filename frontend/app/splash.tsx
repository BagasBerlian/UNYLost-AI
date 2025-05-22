import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logo_unylost.png")}
          style={styles.logoContainer}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Find the Lost, Return the Found</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
  tagline: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
});
