import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URL untuk API - sesuaikan dengan IP address server Anda
const API_BASE_URL = "http://192.168.167.105:5000/api";

// Service utama untuk melakukan request HTTP
const apiService = {
  // Fungsi untuk mengambil token dari AsyncStorage
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log("🔑 Auth token:", token ? "Found" : "Not found");
      return token;
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
      return null;
    }
  },

  // Fungsi untuk melakukan request GET
  async get(endpoint, options = {}) {
    return this.request("GET", endpoint, null, options);
  },

  // Fungsi untuk melakukan request POST
  async post(endpoint, data, options = {}) {
    return this.request("POST", endpoint, data, options);
  },

  // Fungsi untuk melakukan request PUT
  async put(endpoint, data, options = {}) {
    return this.request("PUT", endpoint, data, options);
  },

  // Fungsi untuk melakukan request DELETE
  async delete(endpoint, options = {}) {
    return this.request("DELETE", endpoint, null, options);
  },

  // Fungsi utama untuk melakukan request HTTP
  async request(method, endpoint, data = null, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const token = await this.getAuthToken();

      console.log(`🌐 API Request: ${method} ${url}`);
      if (data) {
        console.log(`📤 Request data:`, data);
      }

      // Menentukan header yang sesuai berdasarkan jenis konten
      let headers = {};

      if (options.headers?.["Content-Type"]) {
        headers["Content-Type"] = options.headers["Content-Type"];
      } else if (data instanceof FormData) {
        // Jika data adalah FormData, tidak perlu set Content-Type (akan diatur otomatis)
        // headers['Content-Type'] = 'multipart/form-data';
      } else {
        headers["Content-Type"] = "application/json";
      }

      // Tambahkan token jika tersedia
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Gabungkan dengan header kustom lainnya
      headers = {
        ...headers,
        ...(options.headers || {}),
      };

      // Membuat konfigurasi request
      const config = {
        method,
        headers,
        ...options,
      };

      // Menambahkan body jika ada data
      if (data) {
        if (data instanceof FormData) {
          config.body = data;
        } else {
          config.body = JSON.stringify(data);
        }
      }

      // Melakukan fetch request
      const response = await fetch(url, config);
      console.log(`📥 Response status: ${response.status}`);

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      console.log(`📥 Response data:`, responseData);

      // Jika respons dari API tidak sukses, throw error
      if (!response.ok) {
        throw new Error(
          typeof responseData === "object" && responseData.message
            ? responseData.message
            : "API request failed"
        );
      }

      // Kembalikan objek dengan format standar
      return {
        success: true,
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);

      return {
        success: false,
        message:
          error.message || "Terjadi kesalahan dalam komunikasi dengan server",
        error,
      };
    }
  },

  // Fungsi untuk tes koneksi dengan backend
  async testConnection() {
    try {
      const response = await this.get("/health");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Connection test failed",
      };
    }
  },
};

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

  async login(email, password) {
    try {
      console.log("🔐 Logging in user:", email);
      const loginData = { email, password };
      const response = await apiService.post("/auth/login", loginData);
      console.log("✅ Login successful");
      return {
        success: true,
        data: response.data,
      };
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
      return {
        success: true,
        data: response.data,
      };
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

  async getProfile() {
    try {
      console.log("👤 Getting user profile");
      const response = await apiService.get("/auth/profile");
      console.log("✅ Profile retrieval successful");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Profile retrieval failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil profil pengguna.",
      };
    }
  },

  async resetPassword(email) {
    try {
      console.log("🔑 Requesting password reset for:", email);
      const response = await apiService.post("/auth/forgot-password", {
        email,
      });
      console.log("✅ Password reset request successful");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Password reset request failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengirim permintaan reset password.",
      };
    }
  },

  async confirmResetPassword(token, password) {
    try {
      console.log("🔑 Confirming password reset");
      const response = await apiService.post(`/auth/reset-password/${token}`, {
        password,
      });
      console.log("✅ Password reset successful");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Password reset failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengatur ulang password.",
      };
    }
  },
};

// Dashboard API - API untuk dashboard
export const dashboardAPI = {
  async getUserStatistics() {
    try {
      console.log("📊 Getting user statistics");
      const response = await apiService.get("/dashboard/user-statistics");

      if (response.success) {
        console.log("✅ User statistics retrieved successfully");
        return {
          success: true,
          data: response.data, // Pastikan ini memiliki format yang benar
        };
      } else {
        console.error("❌ Get user statistics failed with API error");
        return {
          success: false,
          message: response.message || "Failed to get user statistics",
        };
      }
    } catch (error) {
      console.error("❌ Get user statistics failed with exception:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan statistik pengguna",
      };
    }
  },
};

// Found Items API
export const foundItemsAPI = {
  getAll: async () => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/found-items`, { headers });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching found items:", error);
      return { success: false, message: error.message };
    }
  },

  async getMyItems(limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting my found items");
      const response = await apiService.get(
        `/found-items/my-items?limit=${limit}&offset=${offset}`
      );
      console.log("✅ My found items retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get my found items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan daftar barang temuan Anda",
      };
    }
  },

  async getMyFoundItems(limit = 10, offset = 0) {
    console.log("🔍 Getting my found items (alias method)");
    return this.getMyItems(limit, offset);
  },

  getById: async (id) => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/found-items/${id}`, {
        headers,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching found item ${id}:`, error);
      return { success: false, message: error.message };
    }
  },

  createItem: async (formData) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log("Token:", token ? "Available" : "Not available");
      console.log("API URL:", `${API_URL}/found-items`);

      const response = await axios.post(`${API_URL}/found-items`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("API Error - createItem:", error);

      if (error.response) {
        console.log(
          "Server response:",
          error.response.status,
          error.response.data
        );
      }

      return {
        success: false,
        message:
          error.response?.data?.message || "Terjadi kesalahan pada server",
      };
    }
  },

  async update(id, itemData) {
    try {
      console.log(`📝 Updating found item ID: ${id}`);
      const response = await apiService.put(`/found-items/${id}`, itemData);
      console.log("✅ Found item updated successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Update found item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal memperbarui barang temuan",
      };
    }
  },

  async delete(id) {
    try {
      console.log(`🗑️ Deleting found item ID: ${id}`);
      const response = await apiService.delete(`/found-items/${id}`);
      console.log("✅ Found item deleted successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Delete found item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menghapus barang temuan",
      };
    }
  },

  async addImages(itemId, images = []) {
    try {
      console.log(`🖼️ Adding images to found item ID: ${itemId}`);

      const formData = new FormData();

      // Tambahkan gambar jika ada
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          const fileType = image.type || "image/jpeg";
          const fileName = image.fileName || `image-${index}.jpg`;

          formData.append("images", {
            uri: image.uri,
            type: fileType,
            name: fileName,
          });
        });

        const response = await apiService.post(
          `/found-items/${itemId}/images`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("✅ Images added successfully");
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: "Tidak ada gambar yang dipilih",
        };
      }
    } catch (error) {
      console.error("❌ Add images failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menambahkan gambar",
      };
    }
  },

  async deleteImage(itemId, imageId) {
    try {
      console.log(`🗑️ Deleting image ID: ${imageId} from item ID: ${itemId}`);
      const response = await apiService.delete(
        `/found-items/${itemId}/images/${imageId}`
      );
      console.log("✅ Image deleted successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Delete image failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menghapus gambar",
      };
    }
  },

  async setPrimaryImage(itemId, imageId) {
    try {
      console.log(
        `🖼️ Setting primary image ID: ${imageId} for item ID: ${itemId}`
      );
      const response = await apiService.put(
        `/found-items/${itemId}/images/${imageId}/primary`
      );
      console.log("✅ Primary image set successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Set primary image failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menetapkan gambar utama",
      };
    }
  },

  async findMatches(data) {
    try {
      console.log("🔍 Finding matches for found item");

      const formData = new FormData();

      // Tambahkan deskripsi jika ada
      if (data.description) {
        formData.append("description", data.description);
      }

      // Tambahkan gambar jika ada
      if (data.image) {
        const fileType = data.image.type || "image/jpeg";
        const fileName = data.image.fileName || "image.jpg";

        formData.append("file", {
          uri: data.image.uri,
          type: fileType,
          name: fileName,
        });
      }

      const response = await apiService.post(
        "/found-items/find-matches",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Matches found successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Find matches failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mencari kecocokan",
      };
    }
  },
};

// Lost Items API
export const lostItemsAPI = {
  async getAll(limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting lost items");
      const response = await apiService.get(
        `/lost-items?limit=${limit}&offset=${offset}`
      );
      console.log("✅ Lost items retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get lost items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan daftar barang hilang",
      };
    }
  },

  async getMyItems(limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting my lost items");
      const response = await apiService.get(
        `/lost-items/my-items?limit=${limit}&offset=${offset}`
      );
      console.log("✅ My lost items retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get my lost items failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan daftar barang hilang Anda",
      };
    }
  },

  async getMyLostItems(limit = 10, offset = 0) {
    console.log("🔍 Getting my lost items (alias method)");
    return this.getMyItems(limit, offset);
  },

  async getById(id) {
    try {
      console.log(`🔍 Getting lost item details for ID: ${id}`);
      const response = await apiService.get(`/lost-items/${id}`);
      console.log("✅ Lost item details retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get lost item details failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan detail barang hilang",
      };
    }
  },

  async create(itemData, image = null) {
    try {
      console.log("📦 Creating new lost item");

      // Membuat FormData untuk upload gambar
      const formData = new FormData();

      // Tambahkan data item
      Object.keys(itemData).forEach((key) => {
        formData.append(key, itemData[key]);
      });

      // Tambahkan gambar jika ada
      if (image) {
        const fileType = image.type || "image/jpeg";
        const fileName = image.fileName || "image.jpg";

        formData.append("image", {
          uri: image.uri,
          type: fileType,
          name: fileName,
        });
      }

      const response = await apiService.post("/lost-items", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Lost item created successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Create lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal membuat laporan barang hilang",
      };
    }
  },

  async update(id, itemData) {
    try {
      console.log(`📝 Updating lost item ID: ${id}`);
      const response = await apiService.put(`/lost-items/${id}`, itemData);
      console.log("✅ Lost item updated successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Update lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal memperbarui barang hilang",
      };
    }
  },

  async delete(id) {
    try {
      console.log(`🗑️ Deleting lost item ID: ${id}`);
      const response = await apiService.delete(`/lost-items/${id}`);
      console.log("✅ Lost item deleted successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Delete lost item failed:", error);
      return {
        success: false,
        message: error.message || "Gagal menghapus barang hilang",
      };
    }
  },

  async findMatches(data) {
    try {
      console.log("🔍 Finding matches for lost item");

      const formData = new FormData();

      // Tambahkan deskripsi jika ada
      if (data.description) {
        formData.append("description", data.description);
      }

      // Tambahkan gambar jika ada
      if (data.image) {
        const fileType = data.image.type || "image/jpeg";
        const fileName = data.image.fileName || "image.jpg";

        formData.append("file", {
          uri: data.image.uri,
          type: fileType,
          name: fileName,
        });
      }

      const response = await apiService.post(
        "/lost-items/find-matches",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Matches found successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Find matches failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mencari kecocokan",
      };
    }
  },
};

// Categories API
export const categoriesAPI = {
  async getAll() {
    try {
      console.log("📋 Getting categories");
      const response = await apiService.get("/categories");
      console.log("✅ Categories retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get categories failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan daftar kategori",
      };
    }
  },

  async getById(id) {
    try {
      console.log(`📋 Getting category ID: ${id}`);
      const response = await apiService.get(`/categories/${id}`);
      console.log("✅ Category retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get category failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan detail kategori",
      };
    }
  },
};

// Claims API
export const claimsAPI = {
  async getMyClaims(limit = 10, offset = 0) {
    try {
      console.log("🔍 Getting my claims");
      const response = await apiService.get(
        `/claims/my-claims?limit=${limit}&offset=${offset}`
      );
      console.log("✅ My claims retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get my claims failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan daftar klaim Anda",
      };
    }
  },

  async getById(id) {
    try {
      console.log(`🔍 Getting claim details for ID: ${id}`);
      const response = await apiService.get(`/claims/${id}`);
      console.log("✅ Claim details retrieved successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Get claim details failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mendapatkan detail klaim",
      };
    }
  },

  async create(claimData) {
    try {
      console.log("📦 Creating new claim");
      const response = await apiService.post("/claims", claimData);
      console.log("✅ Claim created successfully");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Create claim failed:", error);
      return {
        success: false,
        message: error.message || "Gagal membuat klaim",
      };
    }
  },
};

// Export API Service untuk digunakan langsung jika diperlukan
export default apiService;
