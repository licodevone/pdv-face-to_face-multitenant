import { prisma } from "../lib/db.js";
import { CashSessionOutputDto } from "./OpenCashSession.js";
import { calculateCashSessionExpectedAmountInCents } from "./cash-session-amount.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
}

interface OutputDto {
  cashSession: CashSessionOutputDto | null;
  lastClosedCashSession: CashSessionOutputDto | null;
}

const toCashSessionOutputDto = (
  cashSession: {
    id: string;
    openedById: string;
    closedById: string | null;
    openingAmountInCents: number;
    closingAmountInCents: number | null;
    expectedAmountInCents: number | null;
    profitInCents: number | null;
    status: "OPEN" | "CLOSED";
    openedAt: Date;
    closedAt: Date | null;
  },
  expectedAmountInCents = cashSession.expectedAmountInCents,
): CashSessionOutputDto => ({
  id: cashSession.id,
  openedById: cashSession.openedById,
  closedById: cashSession.closedById,
  openingAmountInCents: cashSession.openingAmountInCents,
  closingAmountInCents: cashSession.closingAmountInCents,
  expectedAmountInCents,
  profitInCents: cashSession.profitInCents,
  status: cashSession.status,
  openedAt: cashSession.openedAt.toISOString(),
  closedAt: cashSession.closedAt?.toISOString() ?? null,
});

export class GetCurrentCashSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const cashSession = await prisma.cashRegisterSession.findFirst({
      where: { tenantId: dto.tenantId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const lastClosedCashSession = await prisma.cashRegisterSession.findFirst({
      where: { tenantId: dto.tenantId, status: "CLOSED" },
      orderBy: [{ closedAt: "desc" }, { openedAt: "desc" }],
    });

    if (!cashSession) {
      return {
        cashSession: null,
        lastClosedCashSession: lastClosedCashSession
          ? toCashSessionOutputDto(lastClosedCashSession)
          : null,
      };
    }

    const expectedAmountInCents = await calculateCashSessionExpectedAmountInCents(
      prisma,
      dto.tenantId,
      cashSession.id,
      cashSession.openingAmountInCents,
    );

    return {
      cashSession: toCashSessionOutputDto(cashSession, expectedAmountInCents),
      lastClosedCashSession: lastClosedCashSession
        ? toCashSessionOutputDto(lastClosedCashSession)
        : null,
    };
  }
}
