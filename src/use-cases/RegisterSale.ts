import { randomUUID } from "node:crypto";
import dayjs from "dayjs";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import { FinancialMath } from "../lib/financial-math.js";
import {
  BadRequestError,
  CashRegisterClosedError,
  InsufficientStockError,
  NotFoundError,
} from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface SaleItemInputDto {
  productId?: string;
  barcode?: string;
  quantity: number;
}

interface PaymentInputDto {
  method: "CASH" | "CARD" | "PIX" | "STORE_CREDIT" | "DIGITAL_WALLET" | "CONTACTLESS";
  amountInCents: number;
  provider?: string;
  externalTransactionId?: string;
  terminalId?: string;
}

interface DeliveryInputDto {
  recipientName: string;
  phone?: string;
  address: string;
  notes?: string;
}

interface InputDto {
  operatorId: string;
  tenantId: string;
  cashSessionId: string;
  customerId?: string;
  items: SaleItemInputDto[];
  payments: PaymentInputDto[];
  discountInCents: number;
  fiscalMode: "ONLINE" | "CONTINGENCY";
  fiscalContingencyReason?: string;
  delivery?: DeliveryInputDto;
  signatureRequired: boolean;
}

interface SaleItemOutputDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceInCents: number;
  unitCostInCents: number;
  totalInCents: number;
}

interface SalePaymentOutputDto {
  id: string;
  method: "CASH" | "CARD" | "PIX" | "STORE_CREDIT" | "DIGITAL_WALLET" | "CONTACTLESS";
  status: "PENDING" | "APPROVED" | "DENIED";
  amountInCents: number;
  provider: string | null;
  externalTransactionId: string | null;
  terminalId: string | null;
  paidAt: string;
}

export interface SaleOutputDto {
  id: string;
  number: string;
  operatorId: string;
  tenantId: string;
  customerId: string | null;
  cashSessionId: string;
  status: "PAID" | "CANCELLED";
  subtotalInCents: number;
  discountInCents: number;
  totalInCents: number;
  changeInCents: number;
  fiscalStatus: "PENDING" | "ISSUED" | "CONTINGENCY" | "CANCELLED";
  fiscalAccessKey: string | null;
  fiscalIssuedAt: string | null;
  fiscalContingencyReason: string | null;
  deliveryRequired: boolean;
  createdAt: string;
  items: SaleItemOutputDto[];
  payments: SalePaymentOutputDto[];
  deliveryTrackingCode: string | null;
  signatureStatus: "PENDING" | "SIGNED" | null;
}

type ProductLookup = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  priceInCents: number;
  costInCents: number;
  stockQuantity: Prisma.Decimal;
};

interface ProductItemAggregator {
  product: ProductLookup;
  quantity: number;
}

interface ResolvedSaleItem {
  product: ProductLookup;
  quantity: number;
  stockBefore: number;
  totalInCents: number;
}

const TERMINAL_REQUIRED_METHODS: ReadonlySet<PaymentInputDto["method"]> = new Set([
  "CARD",
  "CONTACTLESS",
  "DIGITAL_WALLET",
]);

export class RegisterSale {
  async execute(dto: InputDto): Promise<SaleOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const cashSession = await prisma.cashRegisterSession.findUnique({
      where: {
        id_tenantId: {
          id: dto.cashSessionId,
          tenantId: dto.tenantId,
        },
      },
    });

    if (!cashSession || cashSession.status !== "OPEN") {
      throw new CashRegisterClosedError();
    }

    const usesStoreCredit = dto.payments.some((payment) => payment.method === "STORE_CREDIT");

    if (usesStoreCredit && !dto.customerId) {
      throw new BadRequestError("Customer is required for store credit sales");
    }

    if (dto.fiscalMode === "CONTINGENCY" && !dto.fiscalContingencyReason) {
      throw new BadRequestError("fiscalContingencyReason is required in contingency mode");
    }

    const missingTerminalPayment = dto.payments.find(
      (payment) =>
        TERMINAL_REQUIRED_METHODS.has(payment.method) &&
        (!payment.terminalId || !payment.externalTransactionId),
    );

    if (missingTerminalPayment) {
      throw new BadRequestError(
        "Card, contactless and digital wallet payments must include terminalId and externalTransactionId",
      );
    }

    if (dto.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId: dto.tenantId },
        select: { id: true },
      });

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }
    }

    const productIds = dto.items
      .map((item) => item.productId)
      .filter((id): id is string => id !== undefined);

    const barcodes = dto.items
      .map((item) => item.barcode)
      .filter((barcode): barcode is string => barcode !== undefined);

    const products = await prisma.product.findMany({
      where: {
        tenantId: dto.tenantId,
        active: true,
        OR: [
          { id: { in: productIds.length > 0 ? productIds : ["__none__"] } },
          { sku: { in: barcodes.length > 0 ? barcodes : ["__none__"] } },
          { barcode: { in: barcodes.length > 0 ? barcodes : ["__none__"] } },
        ],
      },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        priceInCents: true,
        costInCents: true,
        stockQuantity: true,
      },
    });

    const productById = new Map<string, ProductLookup>(products.map((product) => [product.id, product]));
    const productByCode = new Map<string, ProductLookup>();

    for (const product of products) {
      productByCode.set(product.sku, product);
      if (product.barcode) {
        productByCode.set(product.barcode, product);
      }
    }

    const itemsByProduct = dto.items.reduce<Map<string, ProductItemAggregator>>((acc, item) => {
      const resolvedProduct = item.productId
        ? productById.get(item.productId)
        : item.barcode
          ? productByCode.get(item.barcode)
          : undefined;

      if (!resolvedProduct) {
        throw new NotFoundError(
          item.productId
            ? `Product ${item.productId} not found or inactive`
            : `Product barcode ${item.barcode ?? "unknown"} not found or inactive`,
        );
      }

      const previous = acc.get(resolvedProduct.id);
      const quantity = (previous?.quantity ?? 0) + item.quantity;

      acc.set(resolvedProduct.id, {
        product: resolvedProduct,
        quantity,
      });

      return acc;
    }, new Map<string, ProductItemAggregator>());

    const resolvedItems: ResolvedSaleItem[] = Array.from(itemsByProduct.values()).map((item) => {
      const stockBefore = Number(item.product.stockQuantity);

      return {
        product: item.product,
        quantity: item.quantity,
        stockBefore,
        totalInCents: FinancialMath.calculateTotal(item.product.priceInCents, item.quantity),
      };
    });

    const unavailableItem = resolvedItems.find((item) => item.stockBefore < item.quantity);

    if (unavailableItem) {
      throw new InsufficientStockError(
        `Product ${unavailableItem.product.name} has insufficient stock`,
      );
    }

    const subtotalInCents = resolvedItems.reduce((total, item) => total + item.totalInCents, 0);

    if (dto.discountInCents > subtotalInCents) {
      throw new BadRequestError("Discount cannot be greater than subtotal");
    }

    const totalInCents = subtotalInCents - dto.discountInCents;
    const paidInCents = dto.payments.reduce((total, payment) => total + payment.amountInCents, 0);
    const cashPaidInCents = dto.payments
      .filter((payment) => payment.method === "CASH")
      .reduce((total, payment) => total + payment.amountInCents, 0);

    if (paidInCents < totalInCents) {
      throw new BadRequestError("Payment total is lower than sale total");
    }

    const changeInCents = paidInCents - totalInCents;

    if (changeInCents > 0 && cashPaidInCents === 0) {
      throw new BadRequestError("Change can only be returned for cash payments");
    }

    if (changeInCents > cashPaidInCents) {
      throw new BadRequestError("Change cannot be greater than total cash received");
    }

    const signatureRequired = dto.signatureRequired || usesStoreCredit;
    const fiscalStatus: "PENDING" | "CONTINGENCY" =
      dto.fiscalMode === "CONTINGENCY" ? "CONTINGENCY" : "PENDING";

    const saleNumber = `PDV-${dayjs().format("YYYYMMDDHHmmssSSS")}-${Math.random().toString(36).slice(2, 8)}`;

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sale = await tx.sale.create({
        data: {
          tenantId: dto.tenantId,
          number: saleNumber,
          operatorId: dto.operatorId,
          customerId: dto.customerId ?? null,
          cashSessionId: dto.cashSessionId,
          status: "PAID",
          subtotalInCents,
          discountInCents: dto.discountInCents,
          totalInCents,
          changeInCents,
          deliveryRequired: Boolean(dto.delivery),
          fiscalDocument: {
            create: {
              tenantId: dto.tenantId,
              kind: "NFC_E",
              status: fiscalStatus,
              contingencyReason: dto.fiscalContingencyReason ?? null,
            },
          },
        },
        include: {
          fiscalDocument: true,
        },
      });

      const saleItems = await Promise.all(
        resolvedItems.map(async (item): Promise<SaleItemOutputDto> => {
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              tenantId: dto.tenantId,
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPriceInCents: item.product.priceInCents,
              unitCostInCents: item.product.costInCents,
              totalInCents: item.totalInCents,
            },
          });

          const updated = await tx.product.updateMany({
            where: {
              id: item.product.id,
              tenantId: dto.tenantId,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: {
                decrement: item.quantity.toString() as unknown as Prisma.Decimal,
              },
            },
          });

          if (updated.count !== 1) {
            throw new InsufficientStockError(`Product ${item.product.name} has insufficient stock`);
          }

          await tx.stockMovement.create({
            data: {
              tenantId: dto.tenantId,
              productId: item.product.id,
              saleItemId: saleItem.id,
              operatorId: dto.operatorId,
              type: "SALE",
              quantity: item.quantity,
              previousQuantity: item.stockBefore,
              nextQuantity: item.stockBefore - item.quantity,
              reason: `Venda ${sale.number}`,
            },
          });

          return {
            id: saleItem.id,
            productId: saleItem.productId,
            productName: saleItem.productName,
            quantity: Number(saleItem.quantity),
            unitPriceInCents: saleItem.unitPriceInCents,
            unitCostInCents: saleItem.unitCostInCents,
            totalInCents: saleItem.totalInCents,
          };
        }),
      );

      let remainingChange = changeInCents;
      const payments = await Promise.all(
        dto.payments.map(async (payment): Promise<SalePaymentOutputDto> => {
          const createdPayment = await tx.payment.create({
            data: {
              tenantId: dto.tenantId,
              saleId: sale.id,
              method: payment.method,
              amountInCents: payment.amountInCents,
              provider: payment.provider ?? null,
              externalTransactionId: payment.externalTransactionId ?? null,
              terminalId: payment.terminalId ?? null,
              status: "APPROVED",
            },
          });

          let cashMovementAmountInCents = payment.amountInCents;
          if (payment.method === "CASH" && remainingChange > 0) {
            const deductedChange = Math.min(remainingChange, payment.amountInCents);
            cashMovementAmountInCents -= deductedChange;
            remainingChange -= deductedChange;
          }

          await tx.cashMovement.create({
            data: {
              tenantId: dto.tenantId,
              cashSessionId: dto.cashSessionId,
              operatorId: dto.operatorId,
              type: "SUPPLY",
              amountInCents: cashMovementAmountInCents,
              note: `Recebimento da venda número: ${sale.number}`,
            },
          });

          return {
            id: createdPayment.id,
            method: createdPayment.method,
            status: createdPayment.status,
            amountInCents: createdPayment.amountInCents,
            provider: createdPayment.provider,
            externalTransactionId: createdPayment.externalTransactionId,
            terminalId: createdPayment.terminalId,
            paidAt: createdPayment.paidAt.toISOString(),
          };
        }),
      );

      const deliveryOrder = dto.delivery
        ? await tx.deliveryOrder.create({
            data: {
              tenantId: dto.tenantId,
              saleId: sale.id,
              customerId: dto.customerId ?? null,
              trackingCode: `DLV-${dayjs().format("YYYYMMDDHHmmss")}-${randomUUID().slice(0, 8)}`,
              recipientName: dto.delivery.recipientName,
              phone: dto.delivery.phone ?? null,
              address: dto.delivery.address,
              notes: dto.delivery.notes ?? null,
            },
          })
        : null;

      const signature = signatureRequired
        ? await tx.signature.create({
            data: {
              tenantId: dto.tenantId,
              saleId: sale.id,
              customerId: dto.customerId ?? null,
              status: "PENDING",
            },
          })
        : null;

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "SALE_REGISTERED",
          entity: "Sale",
          entityId: sale.id,
          metadata: {
            number: sale.number,
            totalInCents,
            paymentMethods: dto.payments.map((payment) => payment.method),
            fiscalStatus,
          },
        },
      });

      const fiscalDoc = (sale as unknown as { fiscalDocument: Record<string, unknown> | null })
        .fiscalDocument;

      return {
        id: sale.id,
        number: sale.number,
        operatorId: sale.operatorId,
        tenantId: sale.tenantId,
        customerId: sale.customerId,
        cashSessionId: sale.cashSessionId,
        status: sale.status,
        subtotalInCents: sale.subtotalInCents,
        discountInCents: sale.discountInCents,
        totalInCents: sale.totalInCents,
        changeInCents: sale.changeInCents,
        fiscalStatus:
          (fiscalDoc?.status as "PENDING" | "ISSUED" | "CONTINGENCY" | "CANCELLED" | undefined) ??
          "PENDING",
        fiscalAccessKey: (fiscalDoc?.accessKey as string | undefined) ?? null,
        fiscalIssuedAt:
          fiscalDoc?.issuedAt instanceof Date
            ? fiscalDoc.issuedAt.toISOString()
            : typeof fiscalDoc?.issuedAt === "string"
              ? new Date(fiscalDoc.issuedAt).toISOString()
              : null,
        fiscalContingencyReason: (fiscalDoc?.contingencyReason as string | undefined) ?? null,
        deliveryRequired: sale.deliveryRequired,
        createdAt: sale.createdAt.toISOString(),
        items: saleItems,
        payments,
        deliveryTrackingCode: deliveryOrder?.trackingCode ?? null,
        signatureStatus: signature?.status ?? null,
      };
    });
  }
}
