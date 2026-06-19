import { prisma } from "../lib/db.js";
import { ForbiddenError, UnauthorizedError } from "./errors.js";

interface EnsureOperatorInputDto {
  operatorId: string;
  tenantId: string;
  allowedRoles: string[];
}

export interface OperatorOutputDto {
  id: string;
  tenantId: string;
  role: string;
  name: string;
}

export const ensureOperator = async ({
  operatorId,
  tenantId,
  allowedRoles,
}: EnsureOperatorInputDto): Promise<OperatorOutputDto> => {
  const operator = await prisma.user.findFirst({
    where: {
      id: operatorId,
      tenantId,
    },
    select: { id: true, tenantId: true, role: true, name: true },
  });

  if (!operator) {
    throw new UnauthorizedError();
  }

  if (!allowedRoles.includes(operator.role)) {
    throw new ForbiddenError("Operator does not have permission for this action");
  }

  return {
    id: operator.id,
    tenantId: operator.tenantId,
    role: operator.role,
    name: operator.name,
  };
};
