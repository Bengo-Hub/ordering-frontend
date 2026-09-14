"use client";

/**
 * CategoryTopNav — the horizontal "All Products | Category A | Category B | ..." strip
 * rendered directly under SiteHeader for retail/pharmacy/wholesale profiles (mirrors the
 * reference storefront's top nav row). Shares `buildCategoryTree`/`CategoryFlyoutList`/
 * `CategoryIcon` with CategorySidebar (see lib/category-tree.ts and category-sidebar.tsx)
 * so the two navs are always built from the exact same tree — a category's children and
 * grandchildren show up identically in both places.
 *
 * Each top-level category with children opens a dropdown panel (hover or click) listing
 * its children; deeper levels are the same inline disclosure CategoryFlyoutList already
 * uses in the sidebar. A top-level category with no children is a plain link.
 */

import { useMemo, useState } from "react";

import { CategoryFlyoutList, CategoryIcon } from "@/components/category/category-sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildCategoryTree } from "@/lib/category-tree";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types/catalog";

export interface CategoryTopNavProps {
  categories: MenuCategory[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onAllClick?: () => void;
  useCase?: string;
  className?: string;
}

export function CategoryTopNav({
  categories,
  activeCategory,
  onCategoryChange,
  onAllClick,
  useCase,
  className,
}: CategoryTopNavProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const [openParentId, setOpenParentId] = useState<string | null>(null);

  if (tree.length === 0) return null;

  const handleSelect = (id: string) => {
    onCategoryChange?.(id);
    setOpenParentId(null);
  };

  return (
    <nav
      aria-label="Browse categories"
      className={cn(
        "border-b border-border bg-background",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] sm:gap-2 sm:px-4 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={onAllClick}
          className={cn(
            "shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
            !activeCategory || activeCategory === "all"
              ? "text-primary"
              : "text-foreground hover:bg-muted/50",
          )}
        >
          All Products
        </button>

        {tree.map((parent) => {
          const hasChildren = parent.children.length > 0;
          const isActive =
            activeCategory === parent.id ||
            parent.children.some((c) => c.id === activeCategory || c.children.some((gc) => gc.id === activeCategory));

          if (!hasChildren) {
            return (
              <button
                key={parent.id}
                type="button"
                onClick={() => handleSelect(parent.id)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-primary" : "text-foreground hover:bg-muted/50",
                )}
              >
                {parent.name}
              </button>
            );
          }

          return (
            <Popover
              key={parent.id}
              open={openParentId === parent.id}
              onOpenChange={(open) => setOpenParentId(open ? parent.id : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onMouseEnter={() => setOpenParentId(parent.id)}
                  onClick={() => setOpenParentId((cur) => (cur === parent.id ? null : parent.id))}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-primary" : "text-foreground hover:bg-muted/50",
                  )}
                >
                  {parent.name}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={4}
                className="w-72 p-2"
                onMouseEnter={() => setOpenParentId(parent.id)}
                onMouseLeave={() => setOpenParentId(null)}
              >
                <div className="mb-1 flex items-center gap-2 px-2 py-1">
                  <CategoryIcon category={parent} useCase={useCase} size="size-6" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {parent.name}
                  </p>
                </div>
                <CategoryFlyoutList
                  nodes={parent.children}
                  depth={0}
                  activeCategory={activeCategory}
                  useCase={useCase}
                  onSelect={handleSelect}
                />
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </nav>
  );
}
