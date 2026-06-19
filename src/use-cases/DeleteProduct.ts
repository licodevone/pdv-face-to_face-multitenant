import { prisma } from "../lib/db.js";
import { ConflictError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  productId: string;
}

interface OutputDto {
  deleted: true;
}

export class DeleteProduct {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "STOCKIST"],
    });

    const product = await prisma.product.findUnique({
      where: {
        id_tenantId: {
          id: dto.productId,
          tenantId: dto.tenantId,
        },
      },
      include: {
        _count: {
          select: {
            saleItems: true,
            stockMoves: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (product._count.saleItems > 0 || product._count.stockMoves > 0) {
      throw new ConflictError(
        "Product has sales or stock movements and cannot be deleted",
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({
        where: {
          id_tenantId: {
            id: dto.productId,
            tenantId: dto.tenantId,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "PRODUCT_DELETED",
          entity: "Product",
          entityId: dto.productId,
          metadata: {
            sku: product.sku,
            name: product.name,
            barcode: product.barcode,
            categoryId: product.categoryId,
          },
        },
      });
    });

    return { deleted: true };
  }
}
