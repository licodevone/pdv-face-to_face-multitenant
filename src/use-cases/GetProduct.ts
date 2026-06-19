import { prisma } from "../lib/db.js";
import {
  categoryTreeSelect,
  createCategoryLookup,
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
  productId: string;
}

export class GetProduct {
  async execute(dto: InputDto): Promise<ProductOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER", "STOCKIST"],
    });

    const [categoryTree, product] = await Promise.all([
      prisma.category.findMany({
        where: { tenantId: dto.tenantId },
        select: categoryTreeSelect,
      }),
      prisma.product.findFirst({
        where: { id: dto.productId, tenantId: dto.tenantId },
        include: productWithCategoryInclude,
      }),
    ]);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return mapProductOutput(product, createCategoryLookup(categoryTree));
  }
}
