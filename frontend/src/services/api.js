import API_CONFIG from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

class APIService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    console.log(`🌐 API Base URL: ${this.baseURL}`);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Ensure proper headers for JSON requests
    const defaultHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${config.method || "GET"} ${url}`);

      if (config.body) {
        try {
          const parsedBody = JSON.parse(config.body);
          console.log(`📤 Request data:`, parsedBody);
        } catch (e) {
          console.log(`📤 Request body:`, config.body);
        }
      }

      const response = await fetch(url, config);
      console.log(`📥 Response status: ${response.status}`);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log(`📥 Response data:`, data);
      } else {
        const text = await response.text();
        console.log(`📥 Response text:`, text);
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error(`❌ API Error for ${url}:`, error);

      if (
        error.name === "TypeError" &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Tidak dapat terhubung ke server. Pastikan backend berjalan dan URL sudah benar."
        );
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Koneksi internet bermasalah atau server tidak dapat diakses."
        );
      } else {
        throw error;
      }
    }
  }

  // GET request
  async get(endpoint, token = null) {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: "GET",
      headers,
    });
  }

  // POST request with JSON data
  async post(endpoint, data, token = null) {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  }

  // POST request with FormData (for file uploads)
  async postFormData(endpoint, formData, token = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log(`🌐 API FormData Request: POST ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      console.log(`📥 Response status: ${response.status}`);

      const data = await response.json();
      console.log(`📥 Response data:`, data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error(`❌ API FormData Error for ${url}:`, error);
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data, token = null) {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, token = null) {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request(endpoint, {
      method: "DELETE",
      headers,
    });
  }

  // Test connection method
  async testConnection() {
    try {
      const response = await this.get("/health");
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get token from storage
  async getToken() {
    try {
      return await AsyncStorage.getItem("userToken");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }
}

const apiService = new APIService();

// Auth API
export const authAPI = {
  // Test backend connection
  async testConnection() {
    try {
      console.log("🔍 Testing backend connection...");
      const result = await apiService.testConnection();
      console.log("🔍 Connection test result:", result);
      return result;
    } catch (error) {
      console.error("🔍 Connection test failed:", error);
      return {
        success: false,
        error: error.message || "Connection test failed",
      };
    }
  },

  async register(userData) {
    try {
      console.log("📝 Registering user:", userData.email);

      const requestData = {
        full_name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password,
        phone_number: userData.whatsappNumber,
        address: userData.address || "Yogyakarta",
      };

      console.log("📝 Registration data being sent:", requestData);

      const response = await apiService.post("/auth/register", requestData);
      console.log("✅ Registration successful");
      return response;
    } catch (error) {
      console.error("❌ Registration failed:", error);
      return {
        success: false,
        message: error.message || "Registrasi gagal. Coba lagi nanti.",
      };
    }
  },

  async verifyWhatsapp(phone) {
    try {
      console.log("📱 Verifying WhatsApp:", phone);

      const requestData = { phone };
      console.log("📤 WhatsApp verification request data:", requestData);

      const response = await apiService.post(
        "/auth/verify-whatsapp",
        requestData
      );
      console.log("✅ WhatsApp verification successful");
      return response;
    } catch (error) {
      console.error("❌ WhatsApp verification failed:", error);
      return {
        success: false,
        message:
          error.message ||
          "Verifikasi WhatsApp gagal. Periksa nomor yang dimasukkan.",
      };
    }
  },

  async login(email, password) {
    try {
      console.log("🔐 Logging in user:", email);
      const loginData = { email, password };
      const response = await apiService.post("/auth/login", loginData);
      console.log("✅ Login successful");
      return response;
    } catch (error) {
      console.error("❌ Login failed:", error);
      return {
        success: false,
        message:
          error.message || "Login gagal. Periksa email dan password Anda.",
      };
    }
  },

  async verifyEmail(email, code) {
    try {
      console.log("📧 Verifying email:", email);
      const verifyData = { email, code };
      const response = await apiService.post("/auth/verify-email", verifyData);
      console.log("✅ Email verification successful");
      return response;
    } catch (error) {
      console.error("❌ Email verification failed:", error);
      return {
        success: false,
        message:
          error.message ||
          "Verifikasi email gagal. Periksa kode yang dimasukkan.",
      };
    }
  },

  async getProfile(token) {
    try {
      console.log("👤 Getting user profile");
      const response = await apiService.get("/auth/me", token);
      console.log("✅ Profile retrieved successfully");
      return response;
    } catch (error) {
      console.error("❌ Get profile failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil profil pengguna.",
      };
    }
  },

  async logout(token) {
    try {
      console.log("🚪 Logging out user");
      // For now, just return success since we don't have a logout endpoint yet
      return { success: true, message: "Logout berhasil" };
    } catch (error) {
      console.error("❌ Logout failed:", error);
      return {
        success: false,
        message: error.message || "Logout gagal.",
      };
    }
  },
};

// Categories API
export const categoryAPI = {
  async getCategories(token) {
    try {
      console.log("📋 Getting categories");
      const response = await apiService.get("/categories", token);
      console.log("✅ Categories retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get categories failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil kategori.",
      };
    }
  },
};

// Found Items API
export const foundItemAPI = {
  async getFoundItems(token, limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting found items");
      const response = await apiService.get(
        `/found-items?limit=${limit}&offset=${offset}`,
        token
      );
      console.log("✅ Found items retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get found items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil daftar barang temuan.",
      };
    }
  },

  async getMyFoundItems(token, limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting my found items");
      const response = await apiService.get(
        `/found-items/my-items?limit=${limit}&offset=${offset}`,
        token
      );
      console.log("✅ My found items retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get my found items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil daftar barang temuan Anda.",
      };
    }
  },

  async getFoundItemById(id, token) {
    try {
      console.log(`🔍 Getting found item with id: ${id}`);
      const response = await apiService.get(`/found-items/${id}`, token);
      console.log("✅ Found item retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get found item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil detail barang temuan.",
      };
    }
  },

  async createFoundItem(formData, token) {
    try {
      console.log("📝 Creating found item");
      const response = await apiService.postFormData(
        "/found-items",
        formData,
        token
      );
      console.log("✅ Found item created successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Create found item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal membuat laporan barang temuan.",
      };
    }
  },

  async updateFoundItem(id, data, token) {
    try {
      console.log(`📝 Updating found item with id: ${id}`);
      const response = await apiService.put(`/found-items/${id}`, data, token);
      console.log("✅ Found item updated successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Update found item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengupdate barang temuan.",
      };
    }
  },

  async deleteFoundItem(id, token) {
    try {
      console.log(`🗑️ Deleting found item with id: ${id}`);
      const response = await apiService.delete(`/found-items/${id}`, token);
      console.log("✅ Found item deleted successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Delete found item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menghapus barang temuan.",
      };
    }
  },

  async searchFoundItems(query, token, limit = 10, offset = 0) {
    try {
      console.log(`🔍 Searching found items with query: ${query}`);
      const response = await apiService.get(
        `/found-items/search?q=${encodeURIComponent(
          query
        )}&limit=${limit}&offset=${offset}`,
        token
      );
      console.log("✅ Found items search successful");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Search found items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mencari barang temuan.",
      };
    }
  },
};

// Lost Items API
export const lostItemAPI = {
  async getLostItems(token, limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting lost items");
      const response = await apiService.get(
        `/lost-items?limit=${limit}&offset=${offset}`,
        token
      );
      console.log("✅ Lost items retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get lost items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil daftar barang hilang.",
      };
    }
  },

  async getMyLostItems(token, limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting my lost items");
      const response = await apiService.get(
        `/lost-items/my-items?limit=${limit}&offset=${offset}`,
        token
      );
      console.log("✅ My lost items retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get my lost items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil daftar barang hilang Anda.",
      };
    }
  },

  async getLostItemById(id, token) {
    try {
      console.log(`🔍 Getting lost item with id: ${id}`);
      const response = await apiService.get(`/lost-items/${id}`, token);
      console.log("✅ Lost item retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil detail barang hilang.",
      };
    }
  },

  async createLostItem(formData, token) {
    try {
      console.log("📝 Creating lost item");
      const response = await apiService.postFormData(
        "/lost-items",
        formData,
        token
      );
      console.log("✅ Lost item created successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Create lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal membuat laporan barang hilang.",
      };
    }
  },

  async updateLostItem(id, data, token) {
    try {
      console.log(`📝 Updating lost item with id: ${id}`);
      const response = await apiService.put(`/lost-items/${id}`, data, token);
      console.log("✅ Lost item updated successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Update lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengupdate barang hilang.",
      };
    }
  },

  async deleteLostItem(id, token) {
    try {
      console.log(`🗑️ Deleting lost item with id: ${id}`);
      const response = await apiService.delete(`/lost-items/${id}`, token);
      console.log("✅ Lost item deleted successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Delete lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menghapus barang hilang.",
      };
    }
  },

  async findMatches(id, token) {
    try {
      console.log(`🔍 Finding matches for lost item with id: ${id}`);
      const response = await apiService.get(
        `/lost-items/find-matches/${id}`,
        token
      );
      console.log("✅ Found matches successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Find matches failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mencari barang yang cocok.",
      };
    }
  },
};

// Claims API
export const claimAPI = {
  async createClaim(data, token) {
    try {
      console.log("📝 Creating claim");
      const response = await apiService.post("/claims", data, token);
      console.log("✅ Claim created successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Create claim failed:", error);
      return {
        success: false,
        message: error.message || "Gagal membuat klaim barang.",
      };
    }
  },

  async getMyClaims(token) {
    try {
      console.log("🔍 Getting my claims");
      const response = await apiService.get("/claims/my-claims", token);
      console.log("✅ My claims retrieved successfully");
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Get my claims failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil daftar klaim Anda.",
      };
    }
  },
};

export default apiService;
