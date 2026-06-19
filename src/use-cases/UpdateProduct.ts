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
  productId: string;
  sku?: string;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  unit?: "UNIT" | "KG";
  priceInCents?: number;
  costInCents?: number;
  stockQuantity?: number;
  minimumStock?: number;
  fiscalNcm?: string | null;
  fiscalCfop?: string | null;
  categoryId?: string | null;
  active?: boolean;
}

export class UpdateProduct {
  async execute(dto: InputDto): Promise<ProductOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "STOCKIST"],
    });

    const [categoryTree, existingProduct] = await Promise.all([
      prisma.category.findMany({
        where: { tenantId: dto.tenantId },
        select: categoryTreeSelect,
      }),
      prisma.product.findFirst({
        where: { id: dto.productId, tenantId: dto.tenantId },
        include: productWithCategoryInclude,
      }),
    ]);

    if (!existingProduct) {
      throw new NotFoundError("Product not found");
    }

    const categoryLookup = createCategoryLookup(categoryTree);
    const nextCategoryId =
      dto.categoryId === undefined ? existingProduct.categoryId : dto.categoryId;

    if (nextCategoryId && !categoryLookup.has(nextCategoryId)) {
      throw new NotFoundError("Category not found");
    }

    const nextSku = dto.sku ?? existingProduct.sku;
    const nextBarcode =
      dto.barcode === undefined ? existingProduct.barcode : dto.barcode;

    const duplicateProduct = await prisma.product.findFirst({
      where: {
        tenantId: dto.tenantId,
        NOT: {
          id: dto.productId,
        },
        OR: [
          { sku: nextSku },
          ...(nextBarcode ? [{ barcode: nextBarcode }] : []),
        ],
      },
    });

    if (duplicateProduct) {
      throw new ConflictError("Product SKU or barcode already exists");
    }

    const nextDescription =
      dto.description === undefined ? existingProduct.description : dto.description;
    const nextImageUrl =
      dto.imageUrl === undefined ? existingProduct.imageUrl : dto.imageUrl;
    const nextName = dto.name ?? existingProduct.name;
    const nextUnit = dto.unit ?? existingProduct.unit;
    const nextPriceInCents = dto.priceInCents ?? existingProduct.priceInCents;
    const nextCostInCents = dto.costInCents ?? existingProduct.costInCents;
    const nextStockQuantity =
      dto.stockQuantity ?? Number(existingProduct.stockQuantity);
    const nextMinimumStock =
      dto.minimumStock ?? Number(existingProduct.minimumStock);
    const nextFiscalNcm =
      dto.fiscalNcm === undefined ? existingProduct.fiscalNcm : dto.fiscalNcm;
    const nextFiscalCfop =
      dto.fiscalCfop === undefined ? existingProduct.fiscalCfop : dto.fiscalCfop;
    const nextActive = dto.active ?? existingProduct.active;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: {
          id_tenantId: {
            id: dto.productId,
            tenantId: dto.tenantId,
          },
        },
        data: {
          sku: nextSku,
          barcode: nextBarcode,
          name: nextName,
          description: nextDescription,
          imageUrl: nextImageUrl,
          unit: nextUnit,
          priceInCents: nextPriceInCents,
          costInCents: nextCostInCents,
          stockQuantity: nextStockQuantity,
          minimumStock: nextMinimumStock,
          fiscalNcm: nextFiscalNcm,
          fiscalCfop: nextFiscalCfop,
          categoryId: nextCategoryId,
          active: nextActive,
        },
        include: productWithCategoryInclude,
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "PRODUCT_UPDATED",
          entity: "Product",
          entityId: dto.productId,
          metadata: {
            from: {
              sku: existingProduct.sku,
               barcode: existingProduct.barcode,
               name: existingProduct.name,
               description: existingProduct.description,
               imageUrl: existingProduct.imageUrl,
               unit: existingProduct.unit,
               priceInCents: existingProduct.priceInCents,
              costInCents: existingProduct.costInCents,
              stockQuantity: Number(existingProduct.stockQuantity),
              minimumStock: Number(existingProduct.minimumStock),
              fiscalNcm: existingProduct.fiscalNcm,
              fiscalCfop: existingProduct.fiscalCfop,
              categoryId: existingProduct.categoryId,
              active: existingProduct.active,
            },
            to: {
              sku: nextSku,
               barcode: nextBarcode,
               name: nextName,
               description: nextDescription,
               imageUrl: nextImageUrl,
               unit: nextUnit,
               priceInCents: nextPriceInCents,
              costInCents: nextCostInCents,
              stockQuantity: nextStockQuantity,
              minimumStock: nextMinimumStock,
              fiscalNcm: nextFiscalNcm,
              fiscalCfop: nextFiscalCfop,
              categoryId: nextCategoryId,
              active: nextActive,
            },
          },
        },
      });

      return product;
    });

    return mapProductOutput(updatedProduct, categoryLookup);
  }
}
