import { prisma } from "../lib/db.js";
import { NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
}

export interface OperatorProfileOutputDto {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";
  createdAt: string;
  updatedAt: string;
}

const ALLOWED_OPERATOR_ROLES = ["ADMIN", "MANAGER", "CASHIER", "STOCKIST"] as const;

export class GetOperatorProfile {
  async execute(dto: InputDto): Promise<OperatorProfileOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: [...ALLOWED_OPERATOR_ROLES],
    });

    const operator = await prisma.user.findFirst({
      where: { id: dto.operatorId, tenantId: dto.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!operator) {
      throw new NotFoundError("Operator not found");
    }

    return {
      id: operator.id,
      name: operator.name,
      email: operator.email,
      image: operator.image,
      role: operator.role,
      createdAt: operator.createdAt.toISOString(),
      updatedAt: operator.updatedAt.toISOString(),
    };
  }
}
