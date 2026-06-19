import { prisma } from "../lib/db.js";
import {
  CategoryOutputDto,
  MAX_CATEGORY_LEVEL,
  categoryCountsInclude,
  categoryTreeSelect,
  createCategoryLookup,
  getDescendantCategories,
  mapCategoryOutput,
} from "./category-helpers.js";
import { BadRequestError, ConflictError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  categoryId: string;
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

export class UpdateCategory {
  async execute(dto: InputDto): Promise<CategoryOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "STOCKIST"],
    });

    const [categoryTree, existingCategory] = await Promise.all([
      prisma.category.findMany({
        where: { tenantId: dto.tenantId },
        select: categoryTreeSelect,
      }),
      prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId: dto.tenantId },
        include: categoryCountsInclude,
      }),
    ]);

    if (!existingCategory) {
      throw new NotFoundError("Category not found");
    }

    const categoryLookup = createCategoryLookup(categoryTree);
    const currentCategory = categoryLookup.get(dto.categoryId);

    if (!currentCategory) {
      throw new NotFoundError("Category not found");
    }

    const nextParentId =
      dto.parentId === undefined ? currentCategory.parentId : dto.parentId;

    if (nextParentId === dto.categoryId) {
      throw new BadRequestError("Category cannot be its own parent");
    }

    const descendantCategories = getDescendantCategories(dto.categoryId, categoryTree);

    if (
      nextParentId &&
      descendantCategories.some((category) => category.id === nextParentId)
    ) {
      throw new BadRequestError(
        "Category cannot be moved under one of its subcategories",
      );
    }

    const nextParentCategory = nextParentId ? categoryLookup.get(nextParentId) : null;
    if (nextParentId && !nextParentCategory) {
      throw new NotFoundError("Parent category not found");
    }

    const nextLevel = nextParentCategory ? nextParentCategory.level + 1 : 1;
    const maxRelativeDepth = descendantCategories.reduce(
      (depth, category) => Math.max(depth, category.level - currentCategory.level),
      0,
    );

    if (nextLevel + maxRelativeDepth > MAX_CATEGORY_LEVEL) {
      throw new BadRequestError(
        `Category hierarchy supports up to ${MAX_CATEGORY_LEVEL} levels`,
      );
    }

    const nextName = dto.name ?? currentCategory.name;
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        tenantId: dto.tenantId,
        parentId: nextParentId,
        name: {
          equals: nextName,
          mode: "insensitive",
        },
        NOT: {
          id: dto.categoryId,
        },
      },
    });

    if (duplicateCategory) {
      throw new ConflictError("Category name already exists at this hierarchy level");
    }

    const nextDescription =
      dto.description === undefined ? existingCategory.description : dto.description;
    const levelShift = nextLevel - currentCategory.level;

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: {
          id_tenantId: {
            id: dto.categoryId,
            tenantId: dto.tenantId,
          },
        },
        data: {
          name: nextName,
          description: nextDescription,
          parentId: nextParentId,
          level: nextLevel,
        },
      });

      if (levelShift !== 0) {
        await Promise.all(
          descendantCategories.map((category) =>
            tx.category.update({
              where: {
                id_tenantId: {
                  id: category.id,
                  tenantId: dto.tenantId,
                },
              },
              data: {
                level: category.level + levelShift,
              },
            }),
          ),
        );
      }

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CATEGORY_UPDATED",
          entity: "Category",
          entityId: dto.categoryId,
          metadata: {
            from: {
              name: currentCategory.name,
              description: existingCategory.description,
              parentId: currentCategory.parentId,
              level: currentCategory.level,
            },
            to: {
              name: nextName,
              description: nextDescription,
              parentId: nextParentId,
              level: nextLevel,
            },
          },
        },
      });
    });

    const [updatedCategoryTree, updatedCategory] = await Promise.all([
      prisma.category.findMany({
        where: { tenantId: dto.tenantId },
        select: categoryTreeSelect,
      }),
      prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId: dto.tenantId },
        include: categoryCountsInclude,
      }),
    ]);

    if (!updatedCategory) {
      throw new NotFoundError("Category not found");
    }

    return mapCategoryOutput(updatedCategory, createCategoryLookup(updatedCategoryTree));
  }
}
