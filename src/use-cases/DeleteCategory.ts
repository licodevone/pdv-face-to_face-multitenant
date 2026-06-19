import { prisma } from "../lib/db.js";
import { ConflictError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  categoryId: string;
}

interface OutputDto {
  deleted: true;
}

export class DeleteCategory {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "STOCKIST"],
    });

    const category = await prisma.category.findUnique({
      where: {
        id_tenantId: {
          id: dto.categoryId,
          tenantId: dto.tenantId,
        },
      },
      include: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    if (category._count.children > 0) {
      throw new ConflictError("Category has subcategories and cannot be deleted");
    }

    if (category._count.products > 0) {
      throw new ConflictError("Category has products and cannot be deleted");
    }

    await prisma.$transaction(async (tx) => {
      await tx.category.delete({
        where: {
          id_tenantId: {
            id: dto.categoryId,
            tenantId: dto.tenantId,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CATEGORY_DELETED",
          entity: "Category",
          entityId: dto.categoryId,
          metadata: {
            name: category.name,
            parentId: category.parentId,
            level: category.level,
          },
        },
      });
    });

    return { deleted: true };
  }
}
