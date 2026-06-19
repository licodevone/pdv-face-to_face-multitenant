import { prisma } from "../lib/db.js";
import { ensureOperator } from "./permissions.js";

export interface OperatorListItemOutputDto {
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
}

export class ListOperators {
  async execute(dto: InputDto): Promise<OperatorListItemOutputDto[]> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN"],
    });

    const operators = await prisma.user.findMany({
      where: { tenantId: dto.tenantId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
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

    return operators.map((operator) => ({
      id: operator.id,
      name: operator.name,
      email: operator.email,
      image: operator.image,
      role: operator.role,
      createdAt: operator.createdAt.toISOString(),
      updatedAt: operator.updatedAt.toISOString(),
    }));
  }
}
