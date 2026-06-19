import { Prisma } from "../generated/prisma/client.js";

import { BadRequestError } from "./errors.js";

export const MAX_CATEGORY_LEVEL = 5;

export const categoryTreeSelect = {
  id: true,
  name: true,
  parentId: true,
  level: true,
} satisfies Prisma.CategorySelect;

export const categoryCountsInclude = {
  _count: {
    select: {
      children: true,
      products: true,
    },
  },
} satisfies Prisma.CategoryInclude;

export type CategoryTreeRecord = Prisma.CategoryGetPayload<{
  select: typeof categoryTreeSelect;
}>;

export type CategoryWithCountsRecord = Prisma.CategoryGetPayload<{
  include: typeof categoryCountsInclude;
}>;

export type CategoryLookup = Map<string, CategoryTreeRecord>;

export interface CategorySummaryDto {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  path: string;
}

export interface CategoryOutputDto extends CategorySummaryDto {
  description: string | null;
  childrenCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export const createCategoryLookup = (categories: CategoryTreeRecord[]): CategoryLookup =>
  new Map(categories.map((category) => [category.id, category]));

export const getCategoryPathSegments = (
  categoryId: string,
  lookup: CategoryLookup,
): string[] => {
  const segments: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = categoryId;

  while (currentId) {
    if (visited.has(currentId)) {
      throw new BadRequestError("Circular category hierarchy detected");
    }

    visited.add(currentId);

    const currentCategory = lookup.get(currentId);
    if (!currentCategory) {
      break;
    }

    segments.unshift(currentCategory.name);
    currentId = currentCategory.parentId;
  }

  return segments;
};

export const getCategoryPath = (categoryId: string, lookup: CategoryLookup) =>
  getCategoryPathSegments(categoryId, lookup).join(" > ");

export const getDescendantCategories = (
  categoryId: string,
  categories: CategoryTreeRecord[],
): CategoryTreeRecord[] => {
  const categoriesByParent = new Map<string | null, CategoryTreeRecord[]>();

  for (const category of categories) {
    const siblingCategories = categoriesByParent.get(category.parentId) ?? [];
    siblingCategories.push(category);
    categoriesByParent.set(category.parentId, siblingCategories);
  }

  const descendants: CategoryTreeRecord[] = [];
  const pendingCategories = [...(categoriesByParent.get(categoryId) ?? [])];

  while (pendingCategories.length > 0) {
    const currentCategory = pendingCategories.shift();
    if (!currentCategory) {
      continue;
    }

    descendants.push(currentCategory);
    pendingCategories.push(...(categoriesByParent.get(currentCategory.id) ?? []));
  }

  return descendants;
};

export const sortByCategoryPath = <T extends { id: string }>(
  records: T[],
  lookup: CategoryLookup,
): T[] =>
  [...records].sort((left, right) =>
    getCategoryPath(left.id, lookup).localeCompare(
      getCategoryPath(right.id, lookup),
      "pt-BR",
    ),
  );

export const mapCategorySummary = (
  category: Pick<CategoryTreeRecord, "id" | "name" | "parentId" | "level">,
  lookup: CategoryLookup,
): CategorySummaryDto => ({
  id: category.id,
  name: category.name,
  parentId: category.parentId,
  level: category.level,
  path: getCategoryPath(category.id, lookup),
});

export const mapCategoryOutput = (
  category: CategoryWithCountsRecord,
  lookup: CategoryLookup,
): CategoryOutputDto => ({
  ...mapCategorySummary(category, lookup),
  description: category.description,
  childrenCount: category._count.children,
  productCount: category._count.products,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
});
