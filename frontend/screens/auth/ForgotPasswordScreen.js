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
import { forgotPasswordSchema } from "../../utils/validation";

const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword, loading } = useContext(AuthContext);
  const [generalError, setGeneralError] = useState(null);

  const handleForgotPassword = async (values) => {
    setGeneralError(null);
    const result = await forgotPassword(values.email);

    if (result.success) {
      Alert.alert(
        "Email Terkirim",
        "Instruksi reset password telah dikirim ke email Anda.",
        [
          {
            text: "OK",
            onPress: () => {
              // In development mode, navigate to reset password screen with token
              if (__DEV__ && result.data?.resetToken) {
                navigation.navigate("ResetPassword", {
                  token: result.data.resetToken,
                });
              } else {
                navigation.navigate("Login");
              }
            },
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.heading}>Lupa Password</Text>
            <Text style={styles.subheading}>
              Masukkan email Anda untuk menerima instruksi reset password
            </Text>
          </View>

          {generalError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          <Formik
            initialValues={{ email: "" }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleForgotPassword}
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

                <CustomButton
                  title="Kirim Instruksi"
                  onPress={handleSubmit}
                  loading={loading}
                />

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backButtonText}>Kembali ke Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
      {loading && <Loading message="Mengirim instruksi..." />}
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
    lineHeight: 20,
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
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ForgotPasswordScreen;
