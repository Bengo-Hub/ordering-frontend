/**
 * Shared category-tree builder — turns the flat `MenuCategory[]` the backend returns (each row
 * carrying parentId/sortOrder, see fetchCategories in lib/api/catalog.ts) into a real N-level
 * tree. Used by both CategorySidebar (the "Shop by Category" left rail) and CategoryTopNav (the
 * horizontal "All Products | ..." strip) so the two navs never drift out of sync with each other.
 *
 * A parentId that doesn't resolve to a known category (stale data, or a cross-tenant/global row)
 * is treated as a root — never silently drop a category.
 */

import type { MenuCategory } from "@/types/catalog";

export interface CategoryNode extends MenuCategory {
  children: CategoryNode[];
}

export function buildCategoryTree(categories: MenuCategory[]): CategoryNode[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenByParent = new Map<string, MenuCategory[]>();
  const roots: MenuCategory[] = [];

  for (const cat of categories) {
    if (cat.parentId && byId.has(cat.parentId)) {
      const list = childrenByParent.get(cat.parentId) ?? [];
      list.push(cat);
      childrenByParent.set(cat.parentId, list);
    } else {
      roots.push(cat);
    }
  }

  const bySortOrder = (a: MenuCategory, b: MenuCategory) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  function attachChildren(node: MenuCategory): CategoryNode {
    const children = (childrenByParent.get(node.id) ?? [])
      .slice()
      .sort(bySortOrder)
      .map(attachChildren);
    return { ...node, children };
  }

  return roots.slice().sort(bySortOrder).map(attachChildren);
}

/** True when `node` or any of its descendants matches `id` — drives "is this parent active"
 *  highlighting in both nav components without each re-implementing the walk. */
export function categoryNodeContains(node: CategoryNode, id: string | undefined): boolean {
  if (!id) return false;
  if (node.id === id) return true;
  return node.children.some((child) => categoryNodeContains(child, id));
}
