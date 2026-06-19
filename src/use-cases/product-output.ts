import { Prisma } from "../generated/prisma/client.js";

import {
  CategoryLookup,
  CategorySummaryDto,
  categoryTreeSelect,
  mapCategorySummary,
} from "./category-helpers.js";
import { getStockStatus } from "./stock-status.js";

export const productWithCategoryInclude = {
  category: {
    select: categoryTreeSelect,
  },
} satisfies Prisma.ProductInclude;

export type ProductWithCategoryRecord = Prisma.ProductGetPayload<{
  include: typeof productWithCategoryInclude;
}>;

const decimalToNumber = (value: number | { toString(): string }) =>
  typeof value === "number" ? value : Number(value);

export interface ProductOutputDto {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unit: "UNIT" | "KG";
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  minimumStock: number;
  fiscalNcm: string | null;
  fiscalCfop: string | null;
  categoryId: string | null;
  category: CategorySummaryDto | null;
  active: boolean;
  stockStatus: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
  createdAt: string;
  updatedAt: string;
}

export const mapProductOutput = (
  product: ProductWithCategoryRecord,
  categoryLookup: CategoryLookup,
): ProductOutputDto => {
  const stockQuantity = decimalToNumber(product.stockQuantity);
  const minimumStock = decimalToNumber(product.minimumStock);

  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    unit: product.unit,
    priceInCents: product.priceInCents,
    costInCents: product.costInCents,
    stockQuantity,
    minimumStock,
    fiscalNcm: product.fiscalNcm,
    fiscalCfop: product.fiscalCfop,
    categoryId: product.categoryId,
    category: product.category
      ? mapCategorySummary(product.category, categoryLookup)
      : null,
    active: product.active,
    stockStatus: getStockStatus({ stockQuantity, minimumStock }),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
};
