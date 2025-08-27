import { api } from "./apiClient";
import {
  ApiResponse,
  PaginatedResponse,
  Template,
  TemplateListItem,
  CreateTemplateRequest,
} from "./types";

// Get all templates with pagination and search
export const getTemplates = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<PaginatedResponse<TemplateListItem[]>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);
  return api.getPaginated<TemplateListItem[]>(
    `/me/templates?${params.toString()}`
  );
};

// Get a specific template by ID
export const getTemplate = async (
  id: string
): Promise<ApiResponse<Template>> => {
  return api.get<Template>(`/me/templates/${id}`);
};

// Create a new template
export const createTemplate = async (
  template: CreateTemplateRequest
): Promise<ApiResponse<Template>> => {
  return api.post<Template>("/me/templates", template);
};

// Delete a template
export const deleteTemplate = async (
  id: string
): Promise<ApiResponse<null>> => {
  return api.delete<null>(`/me/templates/${id}`);
};
