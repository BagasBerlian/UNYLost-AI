import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { TextInput } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !phoneNumber || !address) {
      setError("Semua kolom wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    let normalizedPhoneNumber = phoneNumber.trim();
    if (normalizedPhoneNumber.startsWith("0")) {
      normalizedPhoneNumber = `+62${normalizedPhoneNumber.substring(1)}`;
    } else {
      normalizedPhoneNumber = `+62${normalizedPhoneNumber}`;
    }

    try {
      const result = await register({
        full_name: fullName,
        email,
        password,
        phone_number: normalizedPhoneNumber,
        address: address,
      });

      if (!result.success) {
        setError(result.message || "Registrasi gagal");
      } else {
        router.replace("/login");
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Register</Text>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              placeholder="User"
              value={fullName}
              textColor="#000"
              onChangeText={setFullName}
              outlineColor="#E0E0E0"
              activeOutlineColor="#1E88E5"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              placeholder="user@gmail.com"
              value={email}
              textColor="#000"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor="#E0E0E0"
              activeOutlineColor="#1E88E5"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              placeholder="******"
              value={password}
              textColor="#000"
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              outlineColor="#E0E0E0"
              activeOutlineColor="#1E88E5"
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Text style={styles.label}>Alamat</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              placeholder="Jl."
              value={address}
              textColor="#000"
              onChangeText={setAddress}
              outlineColor="#E0E0E0"
              activeOutlineColor="#1E88E5"
            />

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneContainer}>
              <TextInput
                style={styles.countryCode}
                mode="outlined"
                value="+62"
                textColor="#000"
                editable={false}
                outlineColor="#E0E0E0"
                activeOutlineColor="#1E88E5"
              />
              <TextInput
                style={styles.phoneInput}
                mode="outlined"
                placeholder="85314513"
                value={phoneNumber}
                textColor="#000"
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                outlineColor="#E0E0E0"
                activeOutlineColor="#1E88E5"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? "Loading..." : "Register"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E88E5",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  headerText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    color: "white",
    fontSize: 14,
  },
  loginLink: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingTop: 30,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "white",
  },
  phoneContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  countryCode: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "white",
  },
  phoneInput: {
    flex: 3,
    backgroundColor: "white",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  registerButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
