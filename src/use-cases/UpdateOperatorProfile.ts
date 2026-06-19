import { prisma } from "../lib/db.js";
import { ConflictError, ForbiddenError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";
import { OperatorProfileOutputDto } from "./GetOperatorProfile.js";

const ALLOWED_OPERATOR_ROLES = ["ADMIN", "MANAGER", "CASHIER", "STOCKIST"] as const;
type OperatorRole = (typeof ALLOWED_OPERATOR_ROLES)[number];

interface InputDto {
  operatorId: string;
  tenantId: string;
  name?: string;
  email?: string;
  image?: string | null;
  role?: OperatorRole;
}

export class UpdateOperatorProfile {
  async execute(dto: InputDto): Promise<OperatorProfileOutputDto> {
    const currentOperator = await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: [...ALLOWED_OPERATOR_ROLES],
    });

    const existingOperator = await prisma.user.findFirst({
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

    if (!existingOperator) {
      throw new NotFoundError("Operator not found");
    }

    const nextName = dto.name?.trim() ?? existingOperator.name;
    const nextEmail = dto.email?.trim().toLowerCase() ?? existingOperator.email;
    const nextImage =
      dto.image === undefined
        ? existingOperator.image
        : dto.image?.trim() || null;
    const nextRole = dto.role ?? existingOperator.role;

    if (nextRole !== existingOperator.role && currentOperator.role !== "ADMIN") {
      throw new ForbiddenError("Only administrators can change the access profile");
    }

    if (nextEmail !== existingOperator.email) {
      const duplicateOperator = await prisma.user.findFirst({
        where: { email: nextEmail },
        select: { id: true, tenantId: true },
      });

      if (duplicateOperator && duplicateOperator.id !== dto.operatorId) {
        throw new ConflictError(
          duplicateOperator.tenantId === dto.tenantId
            ? "Operator e-mail already exists"
            : "Operator e-mail already belongs to another tenant",
        );
      }
    }

    const updatedOperator = await prisma.$transaction(async (tx) => {
      const operator = await tx.user.update({
        where: {
          id_tenantId: {
            id: dto.operatorId,
            tenantId: dto.tenantId,
          },
        },
        data: {
          name: nextName,
          email: nextEmail,
          image: nextImage,
          role: nextRole,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "OPERATOR_PROFILE_UPDATED",
          entity: "User",
          entityId: dto.operatorId,
          metadata: {
            from: {
              name: existingOperator.name,
              email: existingOperator.email,
              image: existingOperator.image,
              role: existingOperator.role,
            },
            to: {
              name: nextName,
              email: nextEmail,
              image: nextImage,
              role: nextRole,
            },
          },
        },
      });

      return operator;
    });

    return {
      id: updatedOperator.id,
      name: updatedOperator.name,
      email: updatedOperator.email,
      image: updatedOperator.image,
      role: updatedOperator.role,
      createdAt: updatedOperator.createdAt.toISOString(),
      updatedAt: updatedOperator.updatedAt.toISOString(),
    };
  }
}
