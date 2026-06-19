import { prisma } from "../lib/db.js";
import { NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";
import { SaleOutputDto } from "./RegisterSale.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  saleId: string;
}

export class GetSale {
  async execute(dto: InputDto): Promise<SaleOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const sale = await prisma.sale.findFirst({
      where: { id: dto.saleId, tenantId: dto.tenantId },
      include: {
        fiscalDocument: true,
        items: true,
        payments: true,
        delivery: true,
        signature: true,
      },
    });

    if (!sale) {
      throw new NotFoundError("Sale not found");
    }

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
      fiscalStatus: sale.fiscalDocument?.status ?? "PENDING",
      fiscalAccessKey: sale.fiscalDocument?.accessKey ?? null,
      fiscalIssuedAt: sale.fiscalDocument?.issuedAt?.toISOString() ?? null,
      fiscalContingencyReason: sale.fiscalDocument?.contingencyReason ?? null,
      deliveryRequired: sale.deliveryRequired,
      createdAt: sale.createdAt.toISOString(),
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        unitPriceInCents: item.unitPriceInCents,
        unitCostInCents: item.unitCostInCents,
        totalInCents: item.totalInCents,
      })),
      payments: sale.payments.map((payment) => ({
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amountInCents: payment.amountInCents,
        provider: payment.provider,
        externalTransactionId: payment.externalTransactionId,
        terminalId: payment.terminalId,
        paidAt: payment.paidAt.toISOString(),
      })),
      deliveryTrackingCode: sale.delivery?.trackingCode ?? null,
      signatureStatus: sale.signature?.status ?? null,
    };
  }
}
