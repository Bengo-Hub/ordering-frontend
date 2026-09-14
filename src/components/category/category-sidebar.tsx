"use client";

/**
 * CategorySidebar — "Shop by Category" left rail for retail/pharmacy/wholesale
 * profiles. Builds a real N-level tree client-side from the flat `MenuCategory[]`
 * (parentId/parentName/depth/path come from inventory-api via fetchCategories in
 * lib/api/catalog.ts) using the shared `buildCategoryTree` (see lib/category-tree.ts —
 * also used by CategoryTopNav so the two navs never drift out of sync) and renders it as:
 *  - Desktop: a vertical list of top-level categories; a parent with children opens a
 *    flyout panel (hover or click) listing its children. Grandchildren (and deeper) are
 *    an inline expand/collapse disclosure *within* that same flyout panel rather than a
 *    popover-in-popover, which keeps focus/click-outside behavior simple at any depth.
 *    A parent with no children is a plain clickable row (e.g. a genuine standalone root).
 *  - Mobile: a recursive drill-down accordion (no new UI dependency — this repo has no
 *    Accordion/Collapsible primitive yet, so expand/collapse is done with local state,
 *    matching the disclosure pattern already used elsewhere), one level of indentation
 *    per depth.
 *
 * Deliberately NOT a replacement for CategoryCarousel — that icon-rail stays as-is for
 * hospitality/quick_service. This is a parallel component for retail/pharmacy/wholesale.
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { buildCategoryTree, type CategoryNode } from "@/lib/category-tree";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types/catalog";

export interface CategorySidebarProps {
  categories: MenuCategory[];
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  /** Storefront's effective use_case — drives the SVG placeholder for categories with no icon. */
  useCase?: string;
  /** Heading label above the tree (defaults to "Shop by Category"). */
  title?: string;
  className?: string;
}

export function CategoryIcon({
  category,
  useCase,
  size = "size-8",
}: {
  category: MenuCategory;
  useCase?: string | undefined;
  size?: string;
}) {
  if (category.emoji) {
    return <span className={cn("flex items-center justify-center text-lg", size)}>{category.emoji}</span>;
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted", size)}>
      <ImageWithFallback
        src={category.image}
        alt={category.name}
        useCase={useCase}
        width={32}
        height={32}
        className="size-full object-cover"
        loading="lazy"
        iconClassName="size-4"
      />
    </span>
  );
}

/** Recursive list rendered inside a top-level parent's flyout panel — depth 0 here is the
 *  parent's direct children; a node with its own children gets an inline disclosure instead
 *  of nesting another popover, so depth is unbounded without click-outside/z-index headaches. */
export function CategoryFlyoutList({
  nodes,
  depth,
  activeCategory,
  useCase,
  onSelect,
}: {
  nodes: CategoryNode[];
  depth: number;
  activeCategory?: string | undefined;
  useCase?: string | undefined;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ul className={depth > 0 ? "ml-4 border-l border-border/60 pl-2" : undefined}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expanded.has(node.id);
        return (
          <li key={node.id}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  activeCategory === node.id
                    ? "bg-muted font-semibold text-foreground"
                    : "text-foreground hover:bg-muted/50",
                )}
              >
                <CategoryIcon category={node} useCase={useCase} size="size-6" />
                <span className="flex-1 truncate">{node.name}</span>
              </button>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50"
                  aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
                  aria-expanded={isExpanded}
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")} />
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <CategoryFlyoutList
                nodes={node.children}
                depth={depth + 1}
                activeCategory={activeCategory}
                useCase={useCase}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Recursive mobile drill-down accordion — one level of indentation per depth. */
function MobileCategoryAccordion({
  nodes,
  depth,
  activeCategory,
  useCase,
  onSelect,
}: {
  nodes: CategoryNode[];
  depth: number;
  activeCategory?: string | undefined;
  useCase?: string | undefined;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ul className={depth > 0 ? "ml-4 border-l border-border/60 pb-1" : undefined}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expanded.has(node.id);
        const isActive =
          activeCategory === node.id || node.children.some((c) => activeCategory === c.id);
        return (
          <li key={node.id} className={depth === 0 ? "border-b border-border/60 last:border-b-0" : undefined}>
            <button
              type="button"
              onClick={() => (hasChildren ? toggle(node.id) : onSelect(node.id))}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-2.5 px-2 py-2.5 text-left text-sm",
                isActive ? "font-semibold text-foreground" : "text-foreground",
              )}
              aria-expanded={hasChildren ? isExpanded : undefined}
            >
              <CategoryIcon category={node} useCase={useCase} size="size-7" />
              <span className="flex-1 truncate">{node.name}</span>
              {hasChildren && (
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              )}
            </button>
            {hasChildren && isExpanded && (
              <MobileCategoryAccordion
                nodes={node.children}
                depth={depth + 1}
                activeCategory={activeCategory}
                useCase={useCase}
                onSelect={onSelect}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function CategorySidebar({
  categories,
  activeCategory,
  onCategoryChange,
  useCase,
  title = "Shop by Category",
  className,
}: CategorySidebarProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const [openParentId, setOpenParentId] = useState<string | null>(null);

  if (tree.length === 0) return null;

  const handleSelect = (id: string) => {
    onCategoryChange?.(id);
    setOpenParentId(null);
  };

  return (
    <nav aria-label={title} className={cn("w-full", className)}>
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>

      {/* Desktop: vertical list + hover/click flyout */}
      <ul className="hidden md:block">
        {tree.map((parent) => {
          const hasChildren = parent.children.length > 0;
          const isActive =
            activeCategory === parent.id ||
            parent.children.some((c) => c.id === activeCategory || c.children.some((gc) => gc.id === activeCategory));

          if (!hasChildren) {
            return (
              <li key={parent.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(parent.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    isActive ? "bg-muted font-semibold text-foreground" : "text-foreground hover:bg-muted/50",
                  )}
                >
                  <CategoryIcon category={parent} useCase={useCase} size="size-7" />
                  <span className="flex-1 truncate">{parent.name}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={parent.id}>
              <Popover
                open={openParentId === parent.id}
                onOpenChange={(open) => setOpenParentId(open ? parent.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseEnter={() => setOpenParentId(parent.id)}
                    onClick={() => setOpenParentId((cur) => (cur === parent.id ? null : parent.id))}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-muted font-semibold text-foreground" : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <CategoryIcon category={parent} useCase={useCase} size="size-7" />
                    <span className="flex-1 truncate">{parent.name}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  sideOffset={4}
                  className="w-72 p-2"
                  onMouseEnter={() => setOpenParentId(parent.id)}
                  onMouseLeave={() => setOpenParentId(null)}
                >
                  <p className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {parent.name}
                  </p>
                  <CategoryFlyoutList
                    nodes={parent.children}
                    depth={0}
                    activeCategory={activeCategory}
                    useCase={useCase}
                    onSelect={handleSelect}
                  />
                </PopoverContent>
              </Popover>
            </li>
          );
        })}
      </ul>

      {/* Mobile: recursive drill-in accordion */}
      <div className="md:hidden">
        <MobileCategoryAccordion
          nodes={tree}
          depth={0}
          activeCategory={activeCategory}
          useCase={useCase}
          onSelect={handleSelect}
        />
      </div>
    </nav>
  );
}
