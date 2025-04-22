import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { registerSchema } from "../../utils/validation";

const RegisterScreen = ({ navigation }) => {
  const { register, loading } = useContext(AuthContext);
  const [generalError, setGeneralError] = useState(null);

  const handleRegister = async (values) => {
    setGeneralError(null);

    // Remove confirmPassword as it's not needed for the API
    const { confirmPassword, ...userData } = values;

    const result = await register(userData);

    if (result.success) {
      Alert.alert(
        "Registrasi Berhasil",
        "Akun Anda berhasil dibuat. Silakan login untuk melanjutkan.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } else {
      setGeneralError(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.heading}>Daftar Akun</Text>
            <Text style={styles.subheading}>
              Buat akun untuk melaporkan barang hilang atau temuan
            </Text>
          </View>

          {generalError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          <Formik
            initialValues={{
              full_name: "",
              email: "",
              password: "",
              confirmPassword: "",
              phone_number: "",
            }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
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
                  label="Nama Lengkap"
                  value={values.full_name}
                  onChangeText={handleChange("full_name")}
                  onBlur={handleBlur("full_name")}
                  placeholder="Masukkan nama lengkap Anda"
                  autoCapitalize="words"
                  error={touched.full_name && errors.full_name}
                />

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
                  label="Nomor Telepon"
                  value={values.phone_number}
                  onChangeText={handleChange("phone_number")}
                  onBlur={handleBlur("phone_number")}
                  placeholder="Contoh: 081234567890"
                  keyboardType="phone-pad"
                  error={touched.phone_number && errors.phone_number}
                />

                <FormInput
                  label="Password"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  placeholder="Minimal 6 karakter"
                  secureTextEntry
                  error={touched.password && errors.password}
                />

                <FormInput
                  label="Konfirmasi Password"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  placeholder="Masukkan password yang sama"
                  secureTextEntry
                  error={touched.confirmPassword && errors.confirmPassword}
                />

                <CustomButton
                  title="Daftar"
                  onPress={handleSubmit}
                  loading={loading}
                />

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Sudah punya akun? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                  >
                    <Text style={styles.loginLink}>Masuk disini</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
      {loading && <Loading message="Mendaftarkan akun..." />}
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
  header: {
    marginTop: 30,
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "500",
  },
});

export default RegisterScreen;
