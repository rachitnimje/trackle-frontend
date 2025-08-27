// Check if a username is available
export const checkUsernameAvailability = async (
  username: string
): Promise<{ available: boolean; message: string }> => {
  const res = await api.get<{ available: boolean; message: string }>(
    `/check-username?username=${encodeURIComponent(username)}`
  );
  if (res.success && res.data) {
    return res.data;
  }
  return { available: false, message: "Could not check username availability" };
};
import { api } from "./apiClient";
import {
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  User,
} from "./types";
import Cookies from "js-cookie";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

// Login a user and store the token in a cookie
export const login = async (
  credentials: LoginCredentials
): Promise<ApiResponse<LoginResponseData>> => {
  const response = await api.post<LoginResponseData, LoginCredentials>(
    "/login",
    credentials
  );
  if (response.success && response.data.token) {
    Cookies.set("token", response.data.token, { expires: 7 }); // Store for 7 days
  }
  return response;
};

// Register a new user
export const register = async (
  userData: RegisterData
): Promise<ApiResponse<RegisterResponseData>> => {
  return api.post<RegisterResponseData, RegisterData>("/register", userData);
};

// Get the current user's profile
export const getProfile = async (): Promise<ApiResponse<User>> => {
  return api.get<User>("/me");
};

// Logout the user by removing the token
export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await api.post<null>("/logout");
  Cookies.remove("token");
  return response;
};
