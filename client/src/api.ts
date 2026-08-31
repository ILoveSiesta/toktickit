import { RequesterUser, Category, RelatedSystem, ApiResponse } from "./types/index.js";

const rawUrl = import.meta.env.VITE_API_URL || "/api";
const cleanUrl = rawUrl.replace(/\/$/, "");
const API_BASE = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;


export async function fetchRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_BASE}/requesters`);
  if (!res.ok) {
    throw new Error(`Failed to load requesters (HTTP ${res.status})`);
  }
  const json: ApiResponse<RequesterUser[]> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || "Failed to load requesters");
  }
  return json.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) {
    throw new Error(`Failed to load categories (HTTP ${res.status})`);
  }
  const json: ApiResponse<Category[]> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || "Failed to load categories");
  }
  return json.data;
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_BASE}/related-systems`);
  if (!res.ok) {
    throw new Error(`Failed to load related systems (HTTP ${res.status})`);
  }
  const json: ApiResponse<RelatedSystem[]> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || "Failed to load related systems");
  }
  return json.data;
}
