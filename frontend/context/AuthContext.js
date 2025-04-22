import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cek User Token jika User sedang login
    const checkToken = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        const userData = await AsyncStorage.getItem("userData");

        if (userToken && userData) {
          setToken(userToken);
          setUser(JSON.parse(userData));
          api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
        }
      } catch (error) {
        console.error("Error checking token:", error);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post("/auth/login", { email, password });

      const { token: userToken, user: userData } = response.data;

      await AsyncStorage.setItem("userToken", userToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      setToken(userToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post("/auth/register", userData);

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");

      delete api.defaults.headers.common["Authorization"];

      setToken(null);
      setUser(null);

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: "Logout failed" };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post("/auth/forgot-password", { email });

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Password reset request failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || "Password reset failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
