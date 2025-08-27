import { api } from "./apiClient";
import { ApiResponse, PaginatedResponse, Exercise } from "./types";

// Get all exercises with optional pagination
export const getExercises = async (
  page: number = 1,
  limit: number = 1000, // Set high limit to get all exercises
  category?: string,
  search?: string,
  muscle?: string,
  sort?: string
): Promise<PaginatedResponse<Exercise[]>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  if (muscle) params.append("muscle", muscle);
  if (sort) params.append("sort", sort);
  return api.getPaginated<Exercise[]>(`/exercises?${params.toString()}`);
};

// Get a specific exercise by ID
export const getExercise = async (
  id: string | number
): Promise<ApiResponse<Exercise>> => {
  return api.get<Exercise>(`/exercises/${id}`);
};

// Get exercise categories from API
export const getExerciseCategories = async (): Promise<
  ApiResponse<string[]>
> => {
  return api.get<string[]>("/exercises/categories");
};

// Get primary muscles from API
export const getPrimaryMuscles = async (): Promise<ApiResponse<string[]>> => {
  return api.get<string[]>("/exercises/muscles");
};

// Get equipment types from API
export const getEquipmentTypes = async (): Promise<ApiResponse<string[]>> => {
  return api.get<string[]>("/exercises/equipment");
};

// Create a new exercise
export const createExercise = async (
  exerciseData: Omit<Exercise, "id" | "created_at" | "updated_at">
): Promise<ApiResponse<Exercise>> => {
  return api.post<Exercise>("/exercises", exerciseData);
};
