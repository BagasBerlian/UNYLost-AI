import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ReportOptionsScreen({ visible, onClose }) {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnimLost = useRef(new Animated.Value(0.9)).current;
  const scaleAnimFound = useRef(new Animated.Value(0.9)).current;

  // Fungsi untuk menangani animasi keluar
  const handleClose = () => {
    // Animasi penutupan
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimLost, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimFound, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Panggil onClose setelah animasi selesai
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      // Reset animasi saat modal muncul
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      scaleAnimLost.setValue(0.9);
      scaleAnimFound.setValue(0.9);

      // Mulai animasi
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(scaleAnimLost, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(250),
          Animated.timing(scaleAnimFound, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim, scaleAnimLost, scaleAnimFound]);

  const handleReportLost = () => {
    handleClose();
    // Gunakan timeout agar navigasi terjadi setelah modal tertutup
    setTimeout(() => {
      navigation.navigate("ReportLost");
    }, 300);
  };

  const handleReportFound = () => {
    handleClose();
    setTimeout(() => {
      navigation.navigate("ReportFound");
    }, 300);
  };

  const { height } = Dimensions.get("window");
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[styles.modalContainer, { transform: [{ translateY }] }]}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Laporkan Barang</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Animated.View style={{ transform: [{ scale: scaleAnimLost }] }}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.lostButton]}
                  onPress={handleReportLost}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="search" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>
                      Laporkan Barang Hilang
                    </Text>
                    <Text style={styles.optionDescription}>
                      Kehilangan barang? Laporkan agar orang lain dapat membantu
                      menemukan
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#EF4444" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: scaleAnimFound }] }}>
                <TouchableOpacity
                  style={[styles.optionButton, styles.foundButton]}
                  onPress={handleReportFound}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: "#3B82F6" },
                    ]}
                  >
                    <Ionicons name="basket" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>
                      Laporkan Barang Temuan
                    </Text>
                    <Text style={styles.optionDescription}>
                      Menemukan barang? Laporkan agar pemiliknya dapat mengklaim
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  closeButton: {
    padding: 4,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lostButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  foundButton: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
});
