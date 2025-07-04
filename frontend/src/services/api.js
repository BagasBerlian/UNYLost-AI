import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URL untuk API - sesuaikan dengan IP address server Anda
const API_BASE_URL = "http://192.168.134.105:5000/api";

// Service utama untuk melakukan request HTTP
const apiService = {
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem("userToken");
      return token;
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
      return null;
    }
  },

  async request(method, endpoint, data = null, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const token = await this.getAuthToken();

      const headers = options.headers || {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (!(data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      const config = {
        method,
        url,
        data,
        headers,
        timeout: 15000,
        ...options,
      };

      const response = await axios(config);

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error(`❌ API Error for ${method} ${url}:`, error.message);
      const message =
        error.response?.data?.message ||
        "Terjadi kesalahan pada server. Periksa koneksi Anda.";
      return {
        success: false,
        message,
        error,
      };
    }
  },

  async get(endpoint, options = {}) {
    return this.request("GET", endpoint, null, options);
  },

  async post(endpoint, data, options = {}) {
    return this.request("POST", endpoint, data, options);
  },

  async put(endpoint, data, options = {}) {
    return this.request("PUT", endpoint, data, options);
  },

  async delete(endpoint, options = {}) {
    return this.request("DELETE", endpoint, null, options);
  },

  async testConnection() {
    return this.get("/health");
  },
};

// Auth API
export const authAPI = {
  async testConnection() {
    try {
      console.log("🔍 Testing backend connection...");
      const result = await apiService.testConnection();
      console.log("🔍 Connection test result:", result.success);
      return result;
    } catch (error) {
      console.error("🔍 Connection test failed:", error);
      return {
        success: false,
        message: error.message || "Connection test failed",
      };
    }
  },

  // FIX: Mengembalikan fungsi verifyWhatsapp
  async verifyWhatsapp(phoneNumber) {
    try {
      console.log("📱 Verifying WhatsApp number:", phoneNumber);
      // Backend controller `authController.js` mengharapkan objek dengan key `phone`
      const response = await apiService.post("/auth/verify-whatsapp", {
        phone: phoneNumber,
      });
      return response;
    } catch (error) {
      console.error("❌ WhatsApp verification failed in API service:", error);
      return {
        success: false,
        message: error.message || "Gagal memverifikasi nomor WhatsApp.",
      };
    }
  },

  async register(userData) {
    const requestData = {
      full_name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      password: userData.password,
      phone_number: userData.whatsappNumber,
      address: userData.address || "Yogyakarta",
    };
    return apiService.post("/auth/register", requestData);
  },

  async login(email, password) {
    return apiService.post("/auth/login", { email, password });
  },

  async verifyEmail(email, code) {
    return apiService.post("/auth/verify-email", { email, code });
  },

  async getProfile() {
    return apiService.get("/auth/profile");
  },
};

// Dashboard API
export const dashboardAPI = {
  async getUserStatistics() {
    return apiService.get("/dashboard/user-statistics");
  },
};

// Found Items API
export const foundItemAPI = {
  async getMyItems(limit = 10, offset = 0) {
    return apiService.get(
      `/found-items/my-items?limit=${limit}&offset=${offset}`
    );
  },
  async create(formData) {
    return apiService.post("/found-items", formData);
  },
  // ... other methods
};

// Lost Items API
export const lostItemAPI = {
  async getMyItems(limit = 10, offset = 0) {
    return apiService.get(
      `/lost-items/my-items?limit=${limit}&offset=${offset}`
    );
  },
  async create(itemData, image = null) {
    const formData = new FormData();
    Object.keys(itemData).forEach((key) => {
      formData.append(key, itemData[key]);
    });
    if (image) {
      const fileType = image.type || "image/jpeg";
      const fileName = image.fileName || "image.jpg";
      formData.append("image", {
        uri: image.uri,
        type: fileType,
        name: fileName,
      });
    }
    return apiService.post("/lost-items", formData);
  },
  // ... other methods
};

// Categories API
export const categoriesAPI = {
  async getAll() {
    return apiService.get("/categories");
  },
};

// Claims API
export const claimsAPI = {
  async getMyClaims(limit = 10, offset = 0) {
    return apiService.get(`/claims/my-claims?limit=${limit}&offset=${offset}`);
  },
  async create(claimData) {
    return apiService.post("/claims", claimData);
  },
};

export default apiService;
