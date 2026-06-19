import { prisma } from "../lib/db.js";
import {
  CategoryOutputDto,
  categoryCountsInclude,
  categoryTreeSelect,
  createCategoryLookup,
  mapCategoryOutput,
} from "./category-helpers.js";
import { NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  categoryId: string;
}

export class GetCategory {
  async execute(dto: InputDto): Promise<CategoryOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER", "STOCKIST"],
    });

    const [categoryTree, category] = await Promise.all([
      prisma.category.findMany({
        where: { tenantId: dto.tenantId },
        select: categoryTreeSelect,
      }),
      prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId: dto.tenantId },
        include: categoryCountsInclude,
      }),
    ]);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return mapCategoryOutput(category, createCategoryLookup(categoryTree));
  }
}
