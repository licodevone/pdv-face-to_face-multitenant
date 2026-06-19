import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { prisma } from "../lib/db.js";
import { ConflictError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

export interface CreateOperatorOutputDto {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";
  createdAt: string;
  updatedAt: string;
}

interface InputDto {
  operatorId: string;
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";
  image?: string | null;
}

export class CreateOperator {
  async execute(dto: InputDto): Promise<CreateOperatorOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN"],
    });

    const normalizedEmail = dto.email.trim().toLowerCase();
    const trimmedName = dto.name.trim();
    const trimmedImage = dto.image?.trim() || null;

    const existingUserWithEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, tenantId: true },
    });

    if (existingUserWithEmail) {
      throw new ConflictError(
        existingUserWithEmail.tenantId === dto.tenantId
          ? "Operator e-mail already exists"
          : "Operator e-mail already belongs to another tenant",
      );
    }

    const passwordHash = await hashPassword(dto.password);

    const createdOperator = await prisma.$transaction(async (tx) => {
      const operator = await tx.user.create({
        data: {
          id: randomUUID(),
          tenantId: dto.tenantId,
          name: trimmedName,
          email: normalizedEmail,
          emailVerified: true,
          image: trimmedImage,
          role: dto.role,
        },
      });

      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: operator.id,
          providerId: "credential",
          userId: operator.id,
          password: passwordHash,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "OPERATOR_CREATED",
          entity: "User",
          entityId: operator.id,
          metadata: {
            name: operator.name,
            email: operator.email,
            role: operator.role,
          },
        },
      });

      return operator;
    });

    return {
      id: createdOperator.id,
      name: createdOperator.name,
      email: createdOperator.email,
      image: createdOperator.image,
      role: createdOperator.role,
      createdAt: createdOperator.createdAt.toISOString(),
      updatedAt: createdOperator.updatedAt.toISOString(),
    };
  }
}
