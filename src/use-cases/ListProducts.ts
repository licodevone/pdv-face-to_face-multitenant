import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import {
  categoryTreeSelect,
  createCategoryLookup,
  getDescendantCategories,
} from "./category-helpers.js";
import { NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";
import {
  ProductOutputDto,
  mapProductOutput,
  productWithCategoryInclude,
} from "./product-output.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  search?: string;
   categoryId?: string;
   includeSubcategories: boolean;
  includeInactive: boolean;
  onlyLowStock: boolean;
}

interface OutputDto {
  products: ProductOutputDto[];
}

export class ListProducts {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER", "STOCKIST"],
    });

    const categoryTree = await prisma.category.findMany({
      where: { tenantId: dto.tenantId },
      select: categoryTreeSelect,
    });
    const categoryLookup = createCategoryLookup(categoryTree);

    const filteredCategoryIds = (() => {
      if (!dto.categoryId) {
        return undefined;
      }

      const categoryId = dto.categoryId;
      if (!categoryLookup.has(categoryId)) {
        throw new NotFoundError("Category not found");
      }

      if (!dto.includeSubcategories) {
        return [categoryId];
      }

      return [
        categoryId,
        ...getDescendantCategories(categoryId, categoryTree).map(
          (category) => category.id,
        ),
      ];
    })();

    const where: Prisma.ProductWhereInput = {
      tenantId: dto.tenantId,
      ...(dto.includeInactive ? {} : { active: true }),
      ...(filteredCategoryIds
        ? {
            categoryId:
              filteredCategoryIds.length === 1
                ? filteredCategoryIds[0]
                : { in: filteredCategoryIds },
          }
        : {}),
      ...(dto.search
        ? {
            OR: [
              { name: { contains: dto.search, mode: "insensitive" } },
              { sku: { contains: dto.search, mode: "insensitive" } },
              { barcode: { contains: dto.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: productWithCategoryInclude,
    });

    const mappedProducts = products.map((product) =>
      mapProductOutput(product, categoryLookup),
    );

    return {
      products: dto.onlyLowStock
        ? mappedProducts.filter((product) => product.stockStatus !== "AVAILABLE")
        : mappedProducts,
    };
  }
}
