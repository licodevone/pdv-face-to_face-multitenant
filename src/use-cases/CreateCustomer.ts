import { prisma } from "../lib/db.js";
import { ConflictError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  loyaltyCode?: string;
  address?: string;
}

export interface CustomerOutputDto {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  loyaltyCode: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export class CreateCustomer {
  async execute(dto: InputDto): Promise<CustomerOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER"],
    });

    const customerUniqueFilters = [
      ...(dto.cpf ? [{ cpf: dto.cpf }] : []),
      ...(dto.loyaltyCode ? [{ loyaltyCode: dto.loyaltyCode }] : []),
    ];
    const existingCustomer =
      customerUniqueFilters.length > 0
        ? await prisma.customer.findFirst({
            where: {
              tenantId: dto.tenantId,
              OR: customerUniqueFilters,
            },
          })
        : null;

    if (existingCustomer) {
      throw new ConflictError("Customer CPF or loyalty code already exists");
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        cpf: dto.cpf,
        phone: dto.phone,
        email: dto.email,
        loyaltyCode: dto.loyaltyCode,
        address: dto.address,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.operatorId,
        action: "CUSTOMER_CREATED",
        entity: "Customer",
        entityId: customer.id,
        metadata: { cpf: customer.cpf, loyaltyCode: customer.loyaltyCode },
      },
    });

    return {
      id: customer.id,
      name: customer.name,
      cpf: customer.cpf,
      phone: customer.phone,
      email: customer.email,
      loyaltyCode: customer.loyaltyCode,
      address: customer.address,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
