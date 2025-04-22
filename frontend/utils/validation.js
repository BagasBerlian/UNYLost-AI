import * as Yup from "yup";

// Login validation
export const loginSchema = Yup.object().shape({
  email: Yup.string().email("Email tidak valid").required("Email harus diisi"),
  password: Yup.string()
    .required("Password harus diisi")
    .min(6, "Password minimal 6 karakter"),
});

// Registration validation
export const registerSchema = Yup.object().shape({
  full_name: Yup.string()
    .required("Nama lengkap harus diisi")
    .min(3, "Nama terlalu pendek"),
  email: Yup.string().email("Email tidak valid").required("Email harus diisi"),
  password: Yup.string()
    .required("Password harus diisi")
    .min(6, "Password minimal 6 karakter"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Password tidak cocok")
    .required("Konfirmasi password harus diisi"),
  phone_number: Yup.string()
    .required("Nomor telepon harus diisi")
    .matches(/^(\+62|62|0)[\d]{9,13}$/, "Format nomor telepon tidak valid"),
});

// Forgot password validation
export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Email tidak valid").required("Email harus diisi"),
});

// Reset password validation
export const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required("Password baru harus diisi")
    .min(6, "Password minimal 6 karakter"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Password tidak cocok")
    .required("Konfirmasi password harus diisi"),
});
