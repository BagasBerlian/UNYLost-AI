import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Formik } from "formik";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import FormInput from "../../components/FormInput";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";
import { loginSchema } from "../../utils/validation";

const LoginScreen = ({ navigation }) => {
  const { login, loading } = useContext(AuthContext);
  const [generalError, setGeneralError] = useState(null);

  const handleLogin = async (values) => {
    setGeneralError(null);
    const { email, password } = values;
    const result = await login(email, password);

    if (!result.success) {
      setGeneralError(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/Icon_unylost.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              “Find the Lost, Return the Found”
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.heading}>Login</Text>

            {generalError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
              }) => (
                <View style={styles.form}>
                  <FormInput
                    label="Email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    placeholder="Masukkan email Anda"
                    keyboardType="email-address"
                    error={touched.email && errors.email}
                  />

                  <FormInput
                    label="Password"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    placeholder="Masukkan password Anda"
                    secureTextEntry
                    error={touched.password && errors.password}
                  />

                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => navigation.navigate("ForgotPassword")}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Lupa password?
                    </Text>
                  </TouchableOpacity>

                  <CustomButton
                    title="Masuk"
                    onPress={handleSubmit}
                    loading={loading}
                  />

                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Belum punya akun? </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Register")}
                    >
                      <Text style={styles.registerLink}>Daftar disini</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {loading && <Loading message="Sedang masuk..." />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 100,
  },
  tagline: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 0,
  },
  formContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  form: {
    width: "100%",
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#007BFF",
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "500",
  },
});

export default LoginScreen;
