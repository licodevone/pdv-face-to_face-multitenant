import { prisma } from "../lib/db.js";
import { NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  saleId: string;
  signatureImageUrl: string;
}

interface OutputDto {
  id: string;
  saleId: string;
  customerId: string | null;
  status: "PENDING" | "SIGNED";
  signatureImageUrl: string | null;
  signedAt: string | null;
  createdAt: string;
}

export class SignSale {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const sale = await prisma.sale.findFirst({
      where: { id: dto.saleId, tenantId: dto.tenantId },
      include: { signature: true },
    });

    if (!sale) {
      throw new NotFoundError("Sale not found");
    }

    const signature = sale.signature
      ? await prisma.signature.update({
          where: {
            id_tenantId: {
              id: sale.signature.id,
              tenantId: dto.tenantId,
            },
          },
          data: {
            status: "SIGNED",
            signatureImageUrl: dto.signatureImageUrl,
            signedAt: new Date(),
          },
        })
      : await prisma.signature.create({
          data: {
            tenantId: dto.tenantId,
            saleId: dto.saleId,
            customerId: sale.customerId,
            status: "SIGNED",
            signatureImageUrl: dto.signatureImageUrl,
            signedAt: new Date(),
          },
        });

    await prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.operatorId,
        action: "SALE_SIGNED",
        entity: "Signature",
        entityId: signature.id,
        metadata: { saleId: dto.saleId },
      },
    });

    return {
      id: signature.id,
      saleId: signature.saleId,
      customerId: signature.customerId,
      status: signature.status,
      signatureImageUrl: signature.signatureImageUrl,
      signedAt: signature.signedAt?.toISOString() ?? null,
      createdAt: signature.createdAt.toISOString(),
    };
  }
}
