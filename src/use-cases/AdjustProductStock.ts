import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import {
  categoryTreeSelect,
  createCategoryLookup,
} from "./category-helpers.js";
import { InsufficientStockError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";
import {
  ProductOutputDto,
  mapProductOutput,
  productWithCategoryInclude,
} from "./product-output.js";

type StockOperation = "SET" | "INCREMENT" | "DECREMENT";

interface InputDto {
  operatorId: string;
  tenantId: string;
  productId: string;
  operation: StockOperation;
  quantity: number;
}

export class AdjustProductStock {
  async execute(dto: InputDto): Promise<ProductOutputDto> {
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

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id"
        FROM "Product"
        WHERE "id" = ${dto.productId} AND "tenantId" = ${dto.tenantId}
        FOR UPDATE
      `);

      if (lockedRows.length === 0) {
        throw new NotFoundError("Product not found");
      }

      const existingProduct = await tx.product.findUnique({
        where: {
          id_tenantId: {
            id: dto.productId,
            tenantId: dto.tenantId,
          },
        },
        include: productWithCategoryInclude,
      });

      if (!existingProduct) {
        throw new NotFoundError("Product not found");
      }

      const previousQuantity = new Prisma.Decimal(existingProduct.stockQuantity.toString());
      const requestedQuantity = new Prisma.Decimal(dto.quantity);
      const nextQuantity =
        dto.operation === "SET"
          ? requestedQuantity
          : dto.operation === "INCREMENT"
            ? previousQuantity.plus(requestedQuantity)
            : previousQuantity.minus(requestedQuantity);

      if (nextQuantity.isNegative()) {
        throw new InsufficientStockError(
          `Product ${existingProduct.name} has insufficient stock`,
        );
      }

      const product = await tx.product.update({
        where: {
          id_tenantId: {
            id: dto.productId,
            tenantId: dto.tenantId,
          },
        },
        data: {
          stockQuantity: nextQuantity,
        },
        include: productWithCategoryInclude,
      });

      await tx.stockMovement.create({
        data: {
          tenantId: dto.tenantId,
          productId: dto.productId,
          operatorId: dto.operatorId,
          type: "ADJUSTMENT",
          quantity:
            dto.operation === "SET"
              ? nextQuantity.minus(previousQuantity).abs()
              : requestedQuantity,
          previousQuantity,
          nextQuantity,
          reason:
            dto.operation === "SET"
              ? "Ajuste manual de estoque"
              : dto.operation === "INCREMENT"
                ? "Incremento manual de estoque"
                : "Decremento manual de estoque",
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "PRODUCT_STOCK_UPDATED",
          entity: "Product",
          entityId: dto.productId,
          metadata: {
            operation: dto.operation,
            quantity: dto.quantity,
            from: Number(previousQuantity),
            to: Number(nextQuantity),
          },
        },
      });

      return product;
    });

    return mapProductOutput(updatedProduct, categoryLookup);
  }
}
