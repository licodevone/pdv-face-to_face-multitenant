import { prisma } from "../lib/db.js";
import {
  categoryTreeSelect,
  createCategoryLookup,
} from "./category-helpers.js";
import { ConflictError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";
import {
  ProductOutputDto,
  mapProductOutput,
  productWithCategoryInclude,
} from "./product-output.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  unit: "UNIT" | "KG";
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  minimumStock: number;
  fiscalNcm?: string;
  fiscalCfop?: string;
  categoryId?: string;
}

export class CreateProduct {
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

    if (dto.categoryId && !categoryLookup.has(dto.categoryId)) {
      throw new NotFoundError("Category not found");
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId: dto.tenantId,
        OR: [
          { sku: dto.sku },
          ...(dto.barcode ? [{ barcode: dto.barcode }] : []),
        ],
      },
    });

    if (existingProduct) {
      throw new ConflictError("Product SKU or barcode already exists");
    }

    const product = await prisma.product.create({
      data: {
        tenantId: dto.tenantId,
        sku: dto.sku,
        barcode: dto.barcode,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        unit: dto.unit,
        priceInCents: dto.priceInCents,
        costInCents: dto.costInCents,
        stockQuantity: dto.stockQuantity,
        minimumStock: dto.minimumStock,
        fiscalNcm: dto.fiscalNcm,
        fiscalCfop: dto.fiscalCfop,
        categoryId: dto.categoryId,
      },
      include: productWithCategoryInclude,
    });

    await prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.operatorId,
        action: "PRODUCT_CREATED",
        entity: "Product",
        entityId: product.id,
        metadata: {
          sku: product.sku,
          name: product.name,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
        },
      },
    });

    return mapProductOutput(product, categoryLookup);
  }
}
