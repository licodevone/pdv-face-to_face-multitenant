import { prisma } from "../lib/db.js";
import { NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  customerId: string;
}

interface OutputDto {
  deleted: true;
}

export class DeleteCustomer {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER"],
    });

    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId: dto.tenantId },
      include: {
        _count: {
          select: {
            sales: true,
            deliveries: true,
            signatures: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError("Customer not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.customer.delete({
        where: { id: dto.customerId, tenantId: dto.tenantId },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CUSTOMER_DELETED",
          entity: "Customer",
          entityId: dto.customerId,
          metadata: {
            name: customer.name,
            cpf: customer.cpf,
            loyaltyCode: customer.loyaltyCode,
            relatedRecords: {
              sales: customer._count.sales,
              deliveries: customer._count.deliveries,
              signatures: customer._count.signatures,
            },
          },
        },
      });
    });

    return { deleted: true };
  }
}
