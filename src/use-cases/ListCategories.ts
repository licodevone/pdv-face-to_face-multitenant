import { prisma } from "../lib/db.js";
import {
  CategoryOutputDto,
  categoryCountsInclude,
  categoryTreeSelect,
  createCategoryLookup,
  mapCategoryOutput,
  sortByCategoryPath,
} from "./category-helpers.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  search?: string;
  parentId?: string;
}

interface OutputDto {
  categories: CategoryOutputDto[];
}

export class ListCategories {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER", "STOCKIST"],
    });

    const [categoryTree, categories] = await Promise.all([
      prisma.category.findMany({
        where: { tenantId: dto.tenantId },
        select: categoryTreeSelect,
      }),
      prisma.category.findMany({
        where: {
          tenantId: dto.tenantId,
          ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
          ...(dto.search
            ? {
                OR: [
                  {
                    name: {
                      contains: dto.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    description: {
                      contains: dto.search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        include: categoryCountsInclude,
      }),
    ]);

    const categoryLookup = createCategoryLookup(categoryTree);

    return {
      categories: sortByCategoryPath(categories, categoryLookup).map((category) =>
        mapCategoryOutput(category, categoryLookup),
      ),
    };
  }
}
