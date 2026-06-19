import { prisma } from "../lib/db.js";
import { CustomerOutputDto } from "./CreateCustomer.js";
import { ConflictError, NotFoundError } from "./errors.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  customerId: string;
  name?: string;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  loyaltyCode?: string | null;
  address?: string | null;
}

export class UpdateCustomer {
  async execute(dto: InputDto): Promise<CustomerOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER"],
    });

    const existingCustomer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId: dto.tenantId },
    });

    if (!existingCustomer) {
      throw new NotFoundError("Customer not found");
    }

    const nextCpf = dto.cpf === undefined ? existingCustomer.cpf : dto.cpf;
    const nextPhone = dto.phone === undefined ? existingCustomer.phone : dto.phone;
    const nextEmail = dto.email === undefined ? existingCustomer.email : dto.email;
    const nextLoyaltyCode =
      dto.loyaltyCode === undefined
        ? existingCustomer.loyaltyCode
        : dto.loyaltyCode;
    const nextAddress =
      dto.address === undefined ? existingCustomer.address : dto.address;
    const nextName = dto.name ?? existingCustomer.name;

    const customerUniqueFilters = [
      ...(nextCpf ? [{ cpf: nextCpf }] : []),
      ...(nextLoyaltyCode ? [{ loyaltyCode: nextLoyaltyCode }] : []),
    ];
    const duplicateCustomer =
      customerUniqueFilters.length > 0
        ? await prisma.customer.findFirst({
            where: {
              tenantId: dto.tenantId,
              OR: customerUniqueFilters,
              NOT: {
                id: dto.customerId,
              },
            },
          })
        : null;

    if (duplicateCustomer) {
      throw new ConflictError("Customer CPF or loyalty code already exists");
    }

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: {
          id_tenantId: {
            id: dto.customerId,
            tenantId: dto.tenantId,
          },
        },
        data: {
          name: nextName,
          cpf: nextCpf,
          phone: nextPhone,
          email: nextEmail,
          loyaltyCode: nextLoyaltyCode,
          address: nextAddress,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.operatorId,
          action: "CUSTOMER_UPDATED",
          entity: "Customer",
          entityId: dto.customerId,
          metadata: {
            from: {
              name: existingCustomer.name,
              cpf: existingCustomer.cpf,
              phone: existingCustomer.phone,
              email: existingCustomer.email,
              loyaltyCode: existingCustomer.loyaltyCode,
              address: existingCustomer.address,
            },
            to: {
              name: nextName,
              cpf: nextCpf,
              phone: nextPhone,
              email: nextEmail,
              loyaltyCode: nextLoyaltyCode,
              address: nextAddress,
            },
          },
        },
      });

      return customer;
    });

    return {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      cpf: updatedCustomer.cpf,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      loyaltyCode: updatedCustomer.loyaltyCode,
      address: updatedCustomer.address,
      createdAt: updatedCustomer.createdAt.toISOString(),
      updatedAt: updatedCustomer.updatedAt.toISOString(),
    };
  }
}
