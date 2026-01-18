/**
 * TanStack Query Hooks for Menu/Catalog
 * These hooks provide data fetching with caching, loading states, and error handling
 */

import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";

import {
  fetchMenuItems,
  fetchMenuItem,
  fetchFeaturedItems,
  fetchCategories,
  fetchCategory,
  fetchOutlets,
  fetchOutlet,
  fetchOutletMenu,
} from "@/lib/api/menu";
import type { MenuFilters, OutletFilters } from "@/types/menu";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const menuKeys = {
  all: ["menu"] as const,
  items: () => [...menuKeys.all, "items"] as const,
  itemList: (filters?: MenuFilters) => [...menuKeys.items(), filters] as const,
  item: (id: string) => [...menuKeys.items(), id] as const,
  featured: (outletId?: string) => [...menuKeys.items(), "featured", outletId] as const,
  categories: () => [...menuKeys.all, "categories"] as const,
  categoryList: (outletId?: string) => [...menuKeys.categories(), outletId] as const,
  category: (id: string) => [...menuKeys.categories(), id] as const,
};

export const outletKeys = {
  all: ["outlets"] as const,
  list: (filters?: OutletFilters) => [...outletKeys.all, "list", filters] as const,
  detail: (id: string) => [...outletKeys.all, id] as const,
  menu: (outletId: string, filters?: MenuFilters) =>
    [...outletKeys.all, outletId, "menu", filters] as const,
};

// =============================================================================
// MENU ITEMS HOOKS
// =============================================================================

/**
 * Hook to fetch paginated menu items with filters
 */
export function useMenuItems(filters?: MenuFilters, page = 1, limit = 20) {
  return useQuery({
    queryKey: menuKeys.itemList(filters),
    queryFn: () => fetchMenuItems(filters, page, limit),
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch menu items with infinite scroll
 */
export function useInfiniteMenuItems(filters?: MenuFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: [...menuKeys.itemList(filters), "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchMenuItems(filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

/**
 * Hook to fetch a single menu item by ID
 */
export function useMenuItem(id: string) {
  return useQuery({
    queryKey: menuKeys.item(id),
    queryFn: () => fetchMenuItem(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch featured menu items
 */
export function useFeaturedItems(outletId?: string, limit = 10) {
  return useQuery({
    queryKey: menuKeys.featured(outletId),
    queryFn: () => fetchFeaturedItems(outletId, limit),
  });
}

// =============================================================================
// CATEGORIES HOOKS
// =============================================================================

/**
 * Hook to fetch all menu categories
 */
export function useCategories(outletId?: string) {
  return useQuery({
    queryKey: menuKeys.categoryList(outletId),
    queryFn: () => fetchCategories(outletId),
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: menuKeys.category(id),
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  });
}

// =============================================================================
// OUTLETS HOOKS
// =============================================================================

/**
 * Hook to fetch paginated outlets with filters
 */
export function useOutlets(filters?: OutletFilters, page = 1, limit = 20) {
  return useQuery({
    queryKey: outletKeys.list(filters),
    queryFn: () => fetchOutlets(filters, page, limit),
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch outlets with infinite scroll
 */
export function useInfiniteOutlets(filters?: OutletFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: [...outletKeys.list(filters), "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchOutlets(filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

/**
 * Hook to fetch a single outlet by ID
 */
export function useOutlet(id: string) {
  return useQuery({
    queryKey: outletKeys.detail(id),
    queryFn: () => fetchOutlet(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch menu items for a specific outlet
 */
export function useOutletMenu(outletId: string, filters?: MenuFilters, page = 1, limit = 50) {
  return useQuery({
    queryKey: outletKeys.menu(outletId, filters),
    queryFn: () => fetchOutletMenu(outletId, filters, page, limit),
    enabled: !!outletId,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch outlet menu with infinite scroll
 */
export function useInfiniteOutletMenu(outletId: string, filters?: MenuFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: [...outletKeys.menu(outletId, filters), "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchOutletMenu(outletId, filters, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!outletId,
  });
}
