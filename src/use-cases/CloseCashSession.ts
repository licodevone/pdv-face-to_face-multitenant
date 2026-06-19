import { prisma } from "../lib/db.js";
import { CashRegisterClosedError } from "./errors.js";
import { calculateCashSessionExpectedAmountInCents } from "./cash-session-amount.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  cashSessionId: string;
  closingAmountInCents: number;
  note?: string;
}

interface OutputDto {
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

export class CloseCashSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER"],
    });

    const cashSession = await prisma.cashRegisterSession.findFirst({
      where: { id: dto.cashSessionId, tenantId: dto.tenantId },
    });

    if (!cashSession || cashSession.status !== "OPEN") {
      throw new CashRegisterClosedError();
    }

    const closedSession = await prisma.$transaction(async (tx) => {
      const sales = await tx.sale.findMany({
        where: {
          tenantId: dto.tenantId,
          cashSessionId: dto.cashSessionId,
          status: "PAID",
        },
        include: { payments: true, items: true },
      });

      const costInCents = sales
        .flatMap((sale) => sale.items)
        .reduce(
          (total, item) => total + Math.round(item.unitCostInCents * Number(item.quantity)),
          0,
        );
      const salesTotalInCents = sales.reduce(
        (total, sale) => total + sale.totalInCents,
        0,
      );
      const expectedAmountInCents = await calculateCashSessionExpectedAmountInCents(
        tx,
        dto.tenantId,
        dto.cashSessionId,
        cashSession.openingAmountInCents,
      );
      const profitInCents = salesTotalInCents - costInCents;

      await tx.cashMovement.create({
        data: {
          tenantId: dto.tenantId,
          cashSessionId: dto.cashSessionId,
          operatorId: dto.operatorId,
          type: "CLOSING",
          amountInCents: dto.closingAmountInCents,
          note: dto.note ?? "Fechamento de caixa",
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
          closedById: dto.operatorId,
          status: "CLOSED",
          closingAmountInCents: dto.closingAmountInCents,
          expectedAmountInCents,
          profitInCents,
          closedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CASH_SESSION_CLOSED",
          entity: "CashRegisterSession",
          entityId: dto.cashSessionId,
          metadata: {
            closingAmountInCents: dto.closingAmountInCents,
            expectedAmountInCents,
            profitInCents,
          },
        },
      });

      return session;
    });

    return {
      id: closedSession.id,
      openedById: closedSession.openedById,
      closedById: closedSession.closedById,
      openingAmountInCents: closedSession.openingAmountInCents,
      closingAmountInCents: closedSession.closingAmountInCents,
      expectedAmountInCents: closedSession.expectedAmountInCents,
      profitInCents: closedSession.profitInCents,
      status: closedSession.status,
      openedAt: closedSession.openedAt.toISOString(),
      closedAt: closedSession.closedAt?.toISOString() ?? null,
    };
  }
}
