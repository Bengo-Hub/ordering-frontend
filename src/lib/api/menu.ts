/**
 * Menu API Client
 * Functions for fetching menu items, categories, and outlets from the backend
 */

import { api } from "./base";
import type {
  MenuItem,
  MenuCategory,
  MenuFilters,
  Outlet,
  OutletFilters,
  PaginatedResponse,
} from "@/types/menu";

// =============================================================================
// MENU ITEMS API
// =============================================================================

export async function fetchMenuItems(
  filters?: MenuFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<MenuItem>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.dietary?.length) params.set("dietary", filters.dietary.join(","));
  if (filters?.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters?.featured !== undefined) params.set("featured", String(filters.featured));
  if (filters?.outletId) params.set("outletId", filters.outletId);

  const response = await api.get<PaginatedResponse<MenuItem>>(`/menu/items?${params.toString()}`);
  return response.data;
}

export async function fetchMenuItem(id: string): Promise<MenuItem> {
  const response = await api.get<MenuItem>(`/menu/items/${id}`);
  return response.data;
}

export async function fetchFeaturedItems(outletId?: string, limit = 10): Promise<MenuItem[]> {
  const params = new URLSearchParams();
  params.set("featured", "true");
  params.set("limit", String(limit));
  if (outletId) params.set("outletId", outletId);

  const response = await api.get<PaginatedResponse<MenuItem>>(`/menu/items?${params.toString()}`);
  return response.data.data;
}

// =============================================================================
// CATEGORIES API
// =============================================================================

export async function fetchCategories(outletId?: string): Promise<MenuCategory[]> {
  const params = outletId ? `?outletId=${outletId}` : "";
  const response = await api.get<MenuCategory[]>(`/menu/categories${params}`);
  return response.data;
}

export async function fetchCategory(id: string): Promise<MenuCategory> {
  const response = await api.get<MenuCategory>(`/menu/categories/${id}`);
  return response.data;
}

// =============================================================================
// OUTLETS API
// =============================================================================

export async function fetchOutlets(
  filters?: OutletFilters,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<Outlet>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters?.search) params.set("search", filters.search);
  if (filters?.cuisines?.length) params.set("cuisines", filters.cuisines.join(","));
  if (filters?.minRating !== undefined) params.set("minRating", String(filters.minRating));
  if (filters?.maxDeliveryFee !== undefined)
    params.set("maxDeliveryFee", String(filters.maxDeliveryFee));
  if (filters?.maxDeliveryTime !== undefined)
    params.set("maxDeliveryTime", String(filters.maxDeliveryTime));
  if (filters?.isOpen !== undefined) params.set("isOpen", String(filters.isOpen));
  if (filters?.businessType) params.set("businessType", filters.businessType);

  const response = await api.get<PaginatedResponse<Outlet>>(`/outlets?${params.toString()}`);
  return response.data;
}

export async function fetchOutlet(id: string): Promise<Outlet> {
  const response = await api.get<Outlet>(`/outlets/${id}`);
  return response.data;
}

export async function fetchOutletMenu(
  outletId: string,
  filters?: MenuFilters,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<MenuItem>> {
  return fetchMenuItems({ ...filters, outletId }, page, limit);
}
