import { prisma } from "../lib/db.js";
import { CashRegisterClosedError, NotFoundError } from "./errors.js";
import { CashSessionOutputDto } from "./OpenCashSession.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  cashSessionId: string;
  openingAmountInCents: number;
}

export class UpdateCashSessionOpeningAmount {
  async execute(dto: InputDto): Promise<CashSessionOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const cashSession = await prisma.cashRegisterSession.findFirst({
      where: { id: dto.cashSessionId, tenantId: dto.tenantId },
    });

    if (!cashSession) {
      throw new NotFoundError("Cash session not found");
    }

    if (cashSession.status !== "OPEN") {
      throw new CashRegisterClosedError();
    }

    const updatedSession = await prisma.$transaction(async (tx) => {
      await tx.cashMovement.updateMany({
        where: {
          tenantId: dto.tenantId,
          cashSessionId: dto.cashSessionId,
          type: "OPENING",
        },
        data: {
          amountInCents: dto.openingAmountInCents,
          note: "Abertura de caixa ajustada",
        },
      });

      const session = await tx.cashRegisterSession.update({
        where: {
          id_tenantId: {
            id: dto.cashSessionId,
            tenantId: dto.tenantId,
          },
        },
        data: {
          openingAmountInCents: dto.openingAmountInCents,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CASH_SESSION_OPENING_UPDATED",
          entity: "CashRegisterSession",
          entityId: dto.cashSessionId,
          metadata: { openingAmountInCents: dto.openingAmountInCents },
        },
      });

      return session;
    });

    return {
      id: updatedSession.id,
      openedById: updatedSession.openedById,
      closedById: updatedSession.closedById,
      openingAmountInCents: updatedSession.openingAmountInCents,
      closingAmountInCents: updatedSession.closingAmountInCents,
      expectedAmountInCents: updatedSession.expectedAmountInCents,
      profitInCents: updatedSession.profitInCents,
      status: updatedSession.status,
      openedAt: updatedSession.openedAt.toISOString(),
      closedAt: updatedSession.closedAt?.toISOString() ?? null,
    };
  }
}
