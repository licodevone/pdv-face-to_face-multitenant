import { prisma } from "../lib/db.js";
import { BadRequestError, CashRegisterClosedError } from "./errors.js";
import { calculateCashSessionExpectedAmountInCents } from "./cash-session-amount.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  cashSessionId: string;
  type: "SUPPLY" | "WITHDRAWAL";
  amountInCents: number;
  note?: string;
}

export interface CashMovementOutputDto {
  id: string;
  cashSessionId: string;
  operatorId: string;
  tenantId: string;
  type: "OPENING" | "SUPPLY" | "WITHDRAWAL" | "CLOSING";
  amountInCents: number;
  note: string | null;
  createdAt: string;
}

export class RegisterCashMovement {
  async execute(dto: InputDto): Promise<CashMovementOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles:
        dto.type === "WITHDRAWAL"
          ? ["ADMIN", "MANAGER"]
          : ["ADMIN", "MANAGER", "CASHIER"],
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

    if (dto.type === "WITHDRAWAL") {
      const availableAmountInCents = await calculateCashSessionExpectedAmountInCents(
        prisma,
        dto.tenantId,
        dto.cashSessionId,
        cashSession.openingAmountInCents,
      );

      if (dto.amountInCents > availableAmountInCents) {
        throw new BadRequestError("A sangria nao pode ser maior que o saldo disponivel em caixa");
      }
    }

    const movement = await prisma.cashMovement.create({
      data: {
        tenantId: dto.tenantId,
        cashSessionId: dto.cashSessionId,
        operatorId: dto.operatorId,
        type: dto.type,
        amountInCents: dto.amountInCents,
        note: dto.note,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.operatorId,
        action: dto.type === "SUPPLY" ? "CASH_SUPPLIED" : "CASH_WITHDRAWN",
        entity: "CashMovement",
        entityId: movement.id,
        metadata: {
          cashSessionId: dto.cashSessionId,
          amountInCents: dto.amountInCents,
        },
      },
    });

    return {
      id: movement.id,
      cashSessionId: movement.cashSessionId,
      operatorId: movement.operatorId,
      tenantId: movement.tenantId,
      type: movement.type,
      amountInCents: movement.amountInCents,
      note: movement.note,
      createdAt: movement.createdAt.toISOString(),
    };
  }
}
