import { apiClient } from "./apiClient";

export interface WorkoutStats {
  labels: string[];
  data: number[];
}

export interface ExerciseProgress {
  dates: string[];
  weights: number[];
}

export interface Exercise {
  id: string;
  name: string;
}

export interface AggregateStats {
  totalWorkouts: number;
  totalExercises: number;
  avgDuration: number;
  exercises: Exercise[];
}

export const getWorkoutStats = async (
  timeRange: "week" | "month" | "year" = "month"
): Promise<WorkoutStats> => {
  const response = await apiClient.get(
    `/stats/workouts?timeRange=${timeRange}`
  );
  return response.data;
};

export const getExerciseProgress = async (
  exerciseId: string,
  timeRange: "week" | "month" | "year" = "month"
): Promise<ExerciseProgress> => {
  const response = await apiClient.get(
    `/stats/exercises/${exerciseId}?timeRange=${timeRange}`
  );
  return response.data;
};

export const getAggregateStats = async (): Promise<AggregateStats> => {
  const response = await apiClient.get("/stats/aggregate");
  return response.data;
};
