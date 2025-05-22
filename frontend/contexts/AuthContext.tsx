import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role?: string;
}

interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userData: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; message?: string; data?: any }>;
  logout: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType>({
  isLoading: false,
  userToken: null,
  userData: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

const API_URL = "http://192.168.36.105:5000/api";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const userJson = await AsyncStorage.getItem("userData");

        if (token && userJson) {
          setUserToken(token);
          setUserData(JSON.parse(userJson));
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
      } catch (e) {
        console.log("Failed to get token from storage", e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUserToken(token);
      setUserData(user);
      setIsLoading(false);

      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      setIsLoading(false);

      return { success: true, data: response.data };
    } catch (error: any) {
      setIsLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      delete axios.defaults.headers.common["Authorization"];
      setUserToken(null);
      setUserData(null);
      setIsLoading(false);
    } catch (e) {
      console.log("Logout error", e);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userData,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
