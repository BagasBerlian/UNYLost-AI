// File: frontend/src/services/notificationService.js
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "./api";

// Keys untuk AsyncStorage
const NOTIFICATIONS_KEY = "@UNYLost:notifications";
const NOTIFICATION_SETTINGS_KEY = "@UNYLost:notificationSettings";

// Default notification settings
const DEFAULT_SETTINGS = {
  itemMatches: true,
  claimUpdates: true,
  appUpdates: true,
  itemReturned: true,
};

/**
 * Layanan untuk mengelola notifikasi di aplikasi
 */
const notificationService = {
  /**
   * Mengambil semua notifikasi dari penyimpanan lokal
   */
  async getLocalNotifications() {
    try {
      const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch (error) {
      console.error("Error getting local notifications:", error);
      return [];
    }
  },

  /**
   * Menambahkan notifikasi baru ke penyimpanan lokal
   * @param {Object} notification - Objek notifikasi baru
   */
  async addLocalNotification(notification) {
    try {
      const notifications = await this.getLocalNotifications();
      const newNotification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        isRead: false,
        ...notification,
      };

      const updatedNotifications = [newNotification, ...notifications];
      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );

      return newNotification;
    } catch (error) {
      console.error("Error adding local notification:", error);
      return null;
    }
  },

  /**
   * Menandai notifikasi sebagai sudah dibaca
   * @param {string} notificationId - ID notifikasi
   */
  async markAsRead(notificationId) {
    try {
      const notifications = await this.getLocalNotifications();
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );

      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  },

  /**
   * Menandai semua notifikasi sebagai sudah dibaca
   */
  async markAllAsRead() {
    try {
      const notifications = await this.getLocalNotifications();
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));

      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  },

  /**
   * Menghapus notifikasi tertentu
   * @param {string} notificationId - ID notifikasi
   */
  async deleteNotification(notificationId) {
    try {
      const notifications = await this.getLocalNotifications();
      const updatedNotifications = notifications.filter(
        (notification) => notification.id !== notificationId
      );

      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  },

  /**
   * Menghapus semua notifikasi
   */
  async clearAllNotifications() {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
      return true;
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      return false;
    }
  },

  /**
   * Mengambil jumlah notifikasi yang belum dibaca
   */
  async getUnreadCount() {
    try {
      const notifications = await this.getLocalNotifications();
      return notifications.filter((notification) => !notification.isRead)
        .length;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  },

  /**
   * Mengambil pengaturan notifikasi
   */
  async getSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(
        NOTIFICATION_SETTINGS_KEY
      );
      return settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error getting notification settings:", error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Memperbarui pengaturan notifikasi
   * @param {Object} settings - Objek pengaturan notifikasi baru
   */
  async updateSettings(settings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );

      return updatedSettings;
    } catch (error) {
      console.error("Error updating notification settings:", error);
      return null;
    }
  },

  /**
   * Menampilkan notifikasi sebagai alert
   * @param {Object} notification - Objek notifikasi
   */
  showNotificationAlert(notification) {
    Alert.alert(notification.title || "Notifikasi", notification.message, [
      { text: "OK" },
    ]);

    // Juga simpan notifikasi secara lokal
    this.addLocalNotification(notification);
  },

  /**
   * Mengambil notifikasi dari server (untuk diimplementasikan nanti)
   * @param {string} token - Token autentikasi
   */
  async fetchFromServer(token) {
    // Implementasi ini akan ditambahkan nanti ketika backend sudah siap
    try {
      console.log("🔔 Fetching notifications from server");
      // Placeholder untuk API call
      return { success: true, data: [] };
    } catch (error) {
      console.error("❌ Fetch notifications failed:", error);
      return {
        success: false,
        message: error.message || "Gagal mengambil notifikasi.",
      };
    }
  },
};

export default notificationService;
