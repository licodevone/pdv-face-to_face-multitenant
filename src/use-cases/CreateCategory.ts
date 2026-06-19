import { prisma } from "../lib/db.js";
import {
  CategoryOutputDto,
  MAX_CATEGORY_LEVEL,
  categoryCountsInclude,
  categoryTreeSelect,
  createCategoryLookup,
  mapCategoryOutput,
} from "./category-helpers.js";
import { BadRequestError, ConflictError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  name: string;
  description?: string;
  parentId?: string;
}

export class CreateCategory {
  async execute(dto: InputDto): Promise<CategoryOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "STOCKIST"],
    });

    const categoryTree = await prisma.category.findMany({
      where: { tenantId: dto.tenantId },
      select: categoryTreeSelect,
    });
    const categoryLookup = createCategoryLookup(categoryTree);
    const parentCategory = dto.parentId ? categoryLookup.get(dto.parentId) : undefined;

    if (dto.parentId && !parentCategory) {
      throw new NotFoundError("Parent category not found");
    }

    const level = parentCategory ? parentCategory.level + 1 : 1;
    if (level > MAX_CATEGORY_LEVEL) {
      throw new BadRequestError(
        `Category hierarchy supports up to ${MAX_CATEGORY_LEVEL} levels`,
      );
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        tenantId: dto.tenantId,
        parentId: dto.parentId ?? null,
        name: {
          equals: dto.name,
          mode: "insensitive",
        },
      },
    });

    if (duplicateCategory) {
      throw new ConflictError("Category name already exists at this hierarchy level");
    }

    const category = await prisma.category.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        level,
      },
      include: categoryCountsInclude,
    });

    await prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.operatorId,
        action: "CATEGORY_CREATED",
        entity: "Category",
        entityId: category.id,
        metadata: {
          name: category.name,
          parentId: category.parentId,
          level: category.level,
        },
      },
    });

    const updatedCategoryLookup = createCategoryLookup([
      ...categoryTree,
      {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        level: category.level,
      },
    ]);

    return mapCategoryOutput(category, updatedCategoryLookup);
  }
}
