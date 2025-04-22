import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import { resetPasswordSchema } from "../../utils/validation";

const ResetPasswordScreen = ({ navigation, route }) => {
  const { resetPassword, loading } = useContext(AuthContext);
  const [generalError, setGeneralError] = useState(null);
  const { token } = route.params || {};

  const handleResetPassword = async (values) => {
    if (!token) {
      setGeneralError("Token reset password tidak valid");
      return;
    }

    setGeneralError(null);
    const result = await resetPassword(token, values.password);

    if (result.success) {
      Alert.alert(
        "Password Diperbarui",
        "Password Anda berhasil diperbarui. Silakan login dengan password baru.",
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

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorView}>
          <Text style={styles.errorTitle}>Token Tidak Valid</Text>
          <Text style={styles.errorMessage}>
            Link reset password tidak valid atau sudah kadaluarsa.
          </Text>
          <CustomButton
            title="Kembali ke Login"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <Text style={styles.heading}>Reset Password</Text>
            <Text style={styles.subheading}>
              Buat password baru untuk akun Anda
            </Text>
          </View>

          {generalError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          <Formik
            initialValues={{ password: "", confirmPassword: "" }}
            validationSchema={resetPasswordSchema}
            onSubmit={handleResetPassword}
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
                  label="Password Baru"
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
                  title="Reset Password"
                  onPress={handleSubmit}
                  loading={loading}
                />
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
      {loading && <Loading message="Memperbarui password..." />}
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
    paddingTop: 30,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
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
  errorView: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
});

export default ResetPasswordScreen;
