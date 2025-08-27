import { api } from "./apiClient";
import {
  ApiResponse,
  PaginatedResponse,
  Workout,
  WorkoutResponse,
  CreateWorkoutRequest,
} from "./types";

export const getWorkouts = async (
  page = 1,
  limit = 10,
  search = ""
): Promise<PaginatedResponse<Workout[]>> => {
  let url = `/me/workouts?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  return api.getPaginated<Workout[]>(url);
};

export const getWorkout = async (
  id: string
): Promise<ApiResponse<WorkoutResponse>> => {
  return await api.get<WorkoutResponse>(`/me/workouts/${id}`);
};

export const createWorkout = async (
  data: CreateWorkoutRequest
): Promise<ApiResponse<Workout>> => {
  return await api.post<Workout>("/me/workouts", data);
};

export const updateWorkout = async (
  id: string,
  data: Partial<CreateWorkoutRequest>
): Promise<ApiResponse<Workout>> => {
  return await api.put<Workout>(`/me/workouts/${id}`, data);
};

export const deleteWorkout = async (id: string): Promise<ApiResponse<null>> => {
  return await api.delete<null>(`/me/workouts/${id}`);
};