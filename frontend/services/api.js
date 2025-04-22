import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.100.193:5000/api", //  Android emulator
  // baseURL: 'http://localhost:5000/api', // iOS simulator
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
