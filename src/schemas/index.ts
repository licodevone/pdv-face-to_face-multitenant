import { z } from "zod/v4";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const TenantPublicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ListTenantsResponseSchema = z.object({
  tenants: TenantPublicSchema.array(),
});

export const UpdateTenantSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    slug: z.string().trim().min(2).max(48).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (tenant) =>
      tenant.name !== undefined ||
      tenant.slug !== undefined ||
      tenant.isActive !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const DeleteTenantResponseSchema = z.object({
  deleted: z.literal(true),
});

export const ResolvedTenantQuerySchema = z.object({
  tenantId: z.string().trim().min(2).max(48).optional(),
  slug: z.string().trim().min(2).max(48).optional(),
});

export const ProvisionTenantSchema = z.object({
  tenantName: z.string().trim().min(2).max(120),
  tenantId: z.string().trim().min(2).max(48).optional(),
  tenantSlug: z.string().trim().min(2).max(48).optional(),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().email().max(255),
  adminPassword: z.string().min(8).max(128),
});

export const ProvisionTenantResponseSchema = z.object({
  tenant: TenantPublicSchema,
  admin: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: z.literal("ADMIN"),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  }),
});

export const CategorySummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  parentId: z.uuid().nullable(),
  level: z.number().int().min(1).max(5),
  path: z.string(),
});

export const CategorySchema = CategorySummarySchema.extend({
  description: z.string().nullable(),
  childrenCount: z.number().int().nonnegative(),
  productCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  parentId: z.uuid().optional(),
});

export const UpdateCategorySchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    parentId: z.union([z.uuid(), z.null()]).optional(),
  })
  .refine(
    (category) =>
      category.name !== undefined ||
      category.description !== undefined ||
      category.parentId !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const CategoryListQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.uuid().optional(),
});

export const DeleteCategoryResponseSchema = z.object({
  deleted: z.literal(true),
});

export const ProductUnitSchema = z.enum(["UNIT", "KG"]);
export const PaymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "PIX",
  "STORE_CREDIT",
  "DIGITAL_WALLET",
  "CONTACTLESS",
]);
export const CashMovementTypeSchema = z.enum(["SUPPLY", "WITHDRAWAL"]);
const ProductImageSchema = z.string().min(1).max(800_000);
export const DeliveryStatusSchema = z.enum([
  "RECEIVED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const ProductSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  barcode: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: ProductImageSchema.nullable(),
  unit: ProductUnitSchema,
  priceInCents: z.number().int().nonnegative(),
  costInCents: z.number().int().nonnegative(),
  stockQuantity: z.number().nonnegative(),
  minimumStock: z.number().nonnegative(),
  fiscalNcm: z.string().nullable(),
  fiscalCfop: z.string().nullable(),
  categoryId: z.uuid().nullable(),
  category: CategorySummarySchema.nullable(),
  active: z.boolean(),
  stockStatus: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateProductSchema = z.object({
  sku: z.string().min(1).max(64),
  barcode: z.string().min(3).max(64).optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  imageUrl: ProductImageSchema.optional(),
  unit: ProductUnitSchema.default("UNIT"),
  priceInCents: z.number().int().positive(),
  costInCents: z.number().int().nonnegative().default(0),
  stockQuantity: z.number().nonnegative(),
  minimumStock: z.number().nonnegative().default(0),
  fiscalNcm: z.string().min(2).max(12).optional(),
  fiscalCfop: z.string().min(2).max(12).optional(),
  categoryId: z.uuid().optional(),
});

export const UpdateProductSchema = z
  .object({
    sku: z.string().min(1).max(64).optional(),
    barcode: z.union([z.string().min(3).max(64), z.null()]).optional(),
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    imageUrl: z.union([ProductImageSchema, z.null()]).optional(),
    unit: ProductUnitSchema.optional(),
    priceInCents: z.number().int().positive().optional(),
    costInCents: z.number().int().nonnegative().optional(),
    stockQuantity: z.number().nonnegative().optional(),
    minimumStock: z.number().nonnegative().optional(),
    fiscalNcm: z.union([z.string().min(2).max(12), z.null()]).optional(),
    fiscalCfop: z.union([z.string().min(2).max(12), z.null()]).optional(),
    categoryId: z.union([z.uuid(), z.null()]).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (product) =>
       product.sku !== undefined ||
       product.barcode !== undefined ||
       product.name !== undefined ||
       product.description !== undefined ||
       product.imageUrl !== undefined ||
       product.unit !== undefined ||
       product.priceInCents !== undefined ||
       product.costInCents !== undefined ||
      product.stockQuantity !== undefined ||
      product.minimumStock !== undefined ||
      product.fiscalNcm !== undefined ||
      product.fiscalCfop !== undefined ||
      product.categoryId !== undefined ||
      product.active !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const UpdateProductStockSchema = z
  .object({
    operation: z.enum(["SET", "INCREMENT", "DECREMENT"]),
    quantity: z.number().nonnegative(),
  })
  .superRefine((stockUpdate, ctx) => {
    if (stockUpdate.operation !== "SET" && stockUpdate.quantity <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity must be greater than zero for stock increments and decrements",
      });
    }
  });

export const ProductListQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.uuid().optional(),
  includeSubcategories: z.coerce.boolean().default(false),
  includeInactive: z.coerce.boolean().default(false),
  onlyLowStock: z.coerce.boolean().default(false),
});

export const DeleteProductResponseSchema = z.object({
  deleted: z.literal(true),
});

export const CustomerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  cpf: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  loyaltyCode: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  cpf: z.string().min(11).max(14).optional(),
  phone: z.string().min(8).max(30).optional(),
  email: z.email().optional(),
  loyaltyCode: z.string().min(3).max(64).optional(),
  address: z.string().max(300).optional(),
});

export const UpdateCustomerSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    cpf: z.union([z.string().min(11).max(14), z.null()]).optional(),
    phone: z.union([z.string().min(8).max(30), z.null()]).optional(),
    email: z.union([z.email(), z.null()]).optional(),
    loyaltyCode: z.union([z.string().min(3).max(64), z.null()]).optional(),
    address: z.union([z.string().max(300), z.null()]).optional(),
  })
  .refine(
    (customer) =>
      customer.name !== undefined ||
      customer.cpf !== undefined ||
      customer.phone !== undefined ||
      customer.email !== undefined ||
      customer.loyaltyCode !== undefined ||
      customer.address !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const CustomerListQuerySchema = z.object({
  search: z.string().optional(),
});

export const DeleteCustomerResponseSchema = z.object({
  deleted: z.literal(true),
});

export const UserRoleSchema = z.enum(["ADMIN", "MANAGER", "CASHIER", "STOCKIST"]);

export const OperatorProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  role: UserRoleSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UpdateOperatorProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    image: z.union([z.string().trim().url().max(2048), z.null()]).optional(),
    role: UserRoleSchema.optional(),
  })
  .refine(
    (operator) =>
      operator.name !== undefined ||
      operator.email !== undefined ||
      operator.image !== undefined ||
      operator.role !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const CreateOperatorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  image: z.union([z.string().trim().url().max(2048), z.null()]).optional(),
  role: UserRoleSchema,
});

export const UpdateOperatorSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    image: z.union([z.string().trim().url().max(2048), z.null()]).optional(),
    role: UserRoleSchema.optional(),
  })
  .refine(
    (operator) =>
      operator.name !== undefined ||
      operator.email !== undefined ||
      operator.image !== undefined ||
      operator.role !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const ListOperatorsResponseSchema = z.object({
  operators: OperatorProfileSchema.array(),
});

export const ChangeOperatorPasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
    revokeOtherSessions: z.boolean().optional().default(true),
  })
  .refine((passwords) => passwords.currentPassword !== passwords.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const ChangeOperatorPasswordResponseSchema = z.object({
  changed: z.literal(true),
});

export const CashSessionSchema = z.object({
  id: z.uuid(),
  openedById: z.string(),
  closedById: z.string().nullable(),
  openingAmountInCents: z.number().int().nonnegative(),
  closingAmountInCents: z.number().int().nonnegative().nullable(),
  expectedAmountInCents: z.number().int().nullable(),
  profitInCents: z.number().int().nullable(),
  status: z.enum(["OPEN", "CLOSED"]),
  openedAt: z.iso.datetime(),
  closedAt: z.iso.datetime().nullable(),
});

export const CurrentCashSessionResponseSchema = z.object({
  cashSession: CashSessionSchema.nullable(),
  lastClosedCashSession: CashSessionSchema.nullable(),
});

export const OpenCashSessionSchema = z.object({
  openingAmountInCents: z.number().int().positive(),
});

export const UpdateCashSessionOpeningAmountSchema = z.object({
  openingAmountInCents: z.number().int().positive(),
});

export const RegisterCashMovementSchema = z.object({
  type: CashMovementTypeSchema,
  amountInCents: z.number().int().positive(),
  note: z.string().max(300).optional(),
});

export const CloseCashSessionSchema = z.object({
  closingAmountInCents: z.number().int().nonnegative(),
  note: z.string().max(300).optional(),
});

export const CashMovementSchema = z.object({
  id: z.uuid(),
  cashSessionId: z.uuid(),
  operatorId: z.string(),
  type: z.enum(["OPENING", "SUPPLY", "WITHDRAWAL", "CLOSING"]),
  amountInCents: z.number().int().nonnegative(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const SaleItemSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPriceInCents: z.number().int().nonnegative(),
  unitCostInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
});

export const SalePaymentSchema = z.object({
  id: z.uuid(),
  method: PaymentMethodSchema,
  status: z.enum(["PENDING", "APPROVED", "DENIED"]),
  amountInCents: z.number().int().positive(),
  provider: z.string().nullable(),
  externalTransactionId: z.string().nullable(),
  terminalId: z.string().nullable(),
  paidAt: z.iso.datetime(),
});

export const SaleSchema = z.object({
  id: z.uuid(),
  number: z.string(),
  operatorId: z.string(),
  customerId: z.uuid().nullable(),
  cashSessionId: z.uuid(),
  status: z.enum(["PAID", "CANCELLED"]),
  subtotalInCents: z.number().int().nonnegative(),
  discountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  changeInCents: z.number().int().nonnegative(),
  fiscalStatus: z.enum(["PENDING", "ISSUED", "CONTINGENCY", "CANCELLED"]),
  fiscalAccessKey: z.string().nullable(),
  fiscalIssuedAt: z.iso.datetime().nullable(),
  fiscalContingencyReason: z.string().nullable(),
  deliveryRequired: z.boolean(),
  createdAt: z.iso.datetime(),
  items: SaleItemSchema.array(),
  payments: SalePaymentSchema.array(),
  deliveryTrackingCode: z.string().nullable(),
  signatureStatus: z.enum(["PENDING", "SIGNED"]).nullable(),
});

const SaleItemInputSchema = z
  .object({
    productId: z.uuid().optional(),
    barcode: z.string().min(1).optional(),
    quantity: z.number().positive(),
  })
  .refine((item) => item.productId !== undefined || item.barcode !== undefined, {
    message: "productId or barcode is required",
  });

export const RegisterSaleSchema = z
  .object({
    cashSessionId: z.uuid(),
    customerId: z.uuid().optional(),
    items: SaleItemInputSchema.array().min(1),
    payments: z
      .object({
        method: PaymentMethodSchema,
        amountInCents: z.number().int().positive(),
        provider: z.string().max(80).optional(),
        externalTransactionId: z.string().max(120).optional(),
        terminalId: z.string().max(80).optional(),
      })
      .array()
      .min(1),
    discountInCents: z.number().int().nonnegative().default(0),
    fiscalMode: z.enum(["ONLINE", "CONTINGENCY"]).default("ONLINE"),
    fiscalContingencyReason: z.string().max(300).optional(),
    delivery: z
      .object({
        recipientName: z.string().min(2).max(120),
        phone: z.string().max(30).optional(),
        address: z.string().min(5).max(300),
        notes: z.string().max(500).optional(),
      })
      .optional(),
    signatureRequired: z.boolean().default(false),
  })
  .refine(
    (sale) => sale.fiscalMode !== "CONTINGENCY" || sale.fiscalContingencyReason !== undefined,
    {
      message: "fiscalContingencyReason is required in contingency mode",
      path: ["fiscalContingencyReason"],
    },
  );

export const DeliveryOrderSchema = z.object({
  id: z.uuid(),
  saleId: z.uuid(),
  customerId: z.uuid().nullable(),
  trackingCode: z.string(),
  recipientName: z.string(),
  phone: z.string().nullable(),
  address: z.string(),
  notes: z.string().nullable(),
  status: DeliveryStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const DeliveryListQuerySchema = z.object({
  status: DeliveryStatusSchema.optional(),
});

export const UpdateDeliveryStatusSchema = z.object({
  status: DeliveryStatusSchema,
});

export const SignSaleSchema = z.object({
  signatureImageUrl: z.string().min(20).max(5000),
});

export const SignatureSchema = z.object({
  id: z.uuid(),
  saleId: z.uuid(),
  customerId: z.uuid().nullable(),
  status: z.enum(["PENDING", "SIGNED"]),
  signatureImageUrl: z.string().nullable(),
  signedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const FinancialReportQuerySchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export const FinancialReportSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  grossSalesInCents: z.number().int().nonnegative(),
  discountInCents: z.number().int().nonnegative(),
  netSalesInCents: z.number().int().nonnegative(),
  profitInCents: z.number().int(),
  salesCount: z.number().int().nonnegative(),
  averageTicketInCents: z.number().int().nonnegative(),
  byPaymentMethod: z.record(PaymentMethodSchema, z.number().int().nonnegative()),
  daily: z
    .object({
      date: z.iso.date(),
      totalInCents: z.number().int().nonnegative(),
      salesCount: z.number().int().nonnegative(),
    })
    .array(),
  monthly: z
    .object({
      month: z.string(),
      totalInCents: z.number().int().nonnegative(),
      salesCount: z.number().int().nonnegative(),
    })
    .array(),
});
