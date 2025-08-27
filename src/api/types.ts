export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  status?: number;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
  status: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  page: number;
  limit: number;
  total_pages: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string; // Full name (optional for existing users)
  role: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponseData {
  token: string;
}

export interface RegisterResponseData {
  user: User;
}

// Exercise types
export interface Exercise {
  id: number;
  name: string;
  description: string;
  category: string;
  primary_muscle: string;
  equipment: string;
  created_at: string;
  updated_at: string;
}

// Template types
export interface TemplateExercise {
  exercise_id: number;
  sets: number;
  name: string;
  description: string;
  category: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  exercises: TemplateExercise[];
}

// For template listing
export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Workout types
export interface WorkoutEntry {
  id: number;
  workout_id: number;
  exercise_id: number;
  set_number: number;
  reps: number;
  weight: number;
  created_at: string;
  updated_at: string;
  exercise: Exercise;
}

// Individual workout entry from API response (matches backend UserWorkoutEntryResponse)
export interface WorkoutEntryResponse {
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number;
}

export interface Workout {
  id: number;
  user_id: number;
  template_id: number;
  template_name: string;
  name: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  entries: WorkoutEntry[];
}

// Individual workout from API response (matches backend UserWorkoutResponse)
export interface WorkoutResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  template_id: number;
  template_name: string;
  notes: string;
  status: string;
  entries: WorkoutEntryResponse[];
}

// Create request types
export interface CreateTemplateRequest {
  name: string;
  description: string;
  exercises: {
    exercise_id: number;
    sets: number;
  }[];
}

export interface CreateWorkoutRequest {
  template_id: number;
  name: string;
  status: string;
  notes?: string;
  entries: {
    exercise_id: number;
    set_number: number;
    reps: number;
    weight: number;
  }[];
}
