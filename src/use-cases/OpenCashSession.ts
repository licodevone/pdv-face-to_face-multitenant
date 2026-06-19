import { prisma } from "../lib/db.js";
import { ConflictError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  openingAmountInCents: number;
}

export interface CashSessionOutputDto {
  id: string;
  openedById: string;
  closedById: string | null;
  openingAmountInCents: number;
  closingAmountInCents: number | null;
  expectedAmountInCents: number | null;
  profitInCents: number | null;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
}

export class OpenCashSession {
  async execute(dto: InputDto): Promise<CashSessionOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const openSession = await prisma.cashRegisterSession.findFirst({
      where: { tenantId: dto.tenantId, status: "OPEN" },
    });

    if (openSession) {
      throw new ConflictError("There is already an open cash session");
    }

    const cashSession = await prisma.$transaction(async (tx) => {
      const session = await tx.cashRegisterSession.create({
        data: {
          tenantId: dto.tenantId,
          openedById: dto.operatorId,
          openingAmountInCents: dto.openingAmountInCents,
        },
      });

      await tx.cashMovement.create({
        data: {
          tenantId: dto.tenantId,
          cashSessionId: session.id,
          operatorId: dto.operatorId,
          type: "OPENING",
          amountInCents: dto.openingAmountInCents,
          note: "Abertura de caixa",
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CASH_SESSION_OPENED",
          entity: "CashRegisterSession",
          entityId: session.id,
          metadata: { openingAmountInCents: dto.openingAmountInCents },
        },
      });

      return session;
    });

    return {
      id: cashSession.id,
      openedById: cashSession.openedById,
      closedById: cashSession.closedById,
      openingAmountInCents: cashSession.openingAmountInCents,
      closingAmountInCents: cashSession.closingAmountInCents,
      expectedAmountInCents: cashSession.expectedAmountInCents,
      profitInCents: cashSession.profitInCents,
      status: cashSession.status,
      openedAt: cashSession.openedAt.toISOString(),
      closedAt: cashSession.closedAt?.toISOString() ?? null,
    };
  }
}
