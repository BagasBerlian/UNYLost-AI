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
import { TextInput, Checkbox } from "react-native-paper";
import { router } from "expo-router";
import { AuthContext } from "../contexts/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message || "Login gagal");
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
            <Text style={styles.logoText}>LOGO UNYLOST</Text>
            <Text style={styles.headerText}>Sign in to your Account</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              mode="outlined"
              placeholder="user@gmail.com"
              value={email}
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

            <View style={styles.rememberContainer}>
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={rememberMe ? "checked" : "unchecked"}
                  onPress={() => setRememberMe(!rememberMe)}
                  color="#1E88E5"
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Loading..." : "Log In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or login with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>SSO</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Dont have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              By signing, you agree to the{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Data Processing Agreement</Text>
            </Text>
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
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  headerText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
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
  rememberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#444",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#1E88E5",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  socialButtonText: {
    color: "#333",
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#444",
  },
  signupLink: {
    fontSize: 14,
    color: "#1E88E5",
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  termsLink: {
    color: "#1E88E5",
  },
});
