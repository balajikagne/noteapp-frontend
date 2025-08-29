import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000"
});

// Request interceptor to automatically add auth token from cookies
API.interceptors.request.use(
  (config) => {
    const token = Cookies.get("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      Cookies.remove("authToken");
      Cookies.remove("userData");
      
      // Redirect to login page if we're in a browser environment
      if (typeof window !== "undefined") {
        window.location.href = "/signup";
      }
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token?: string) {
  if (token) {
    Cookies.set("authToken", token, { 
      expires: 7,
      secure: import.meta.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    Cookies.remove("authToken");
    delete API.defaults.headers.common["Authorization"];
  }
}

// Helper function to get auth token from cookies
export function getAuthToken(): string | undefined {
  return Cookies.get("authToken");
}

// Helper function to clear all auth-related cookies
export function clearAuthData() {
  Cookies.remove("authToken");
  Cookies.remove("userData");
  Cookies.remove("pendingEmail");
  delete API.defaults.headers.common["Authorization"];
}

export default API;