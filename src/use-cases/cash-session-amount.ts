import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";

type DbClient = typeof prisma | Prisma.TransactionClient;

export const calculateCashSessionExpectedAmountInCents = async (
  db: DbClient,
  tenantId: string,
  cashSessionId: string,
  openingAmountInCents: number,
) => {
  const [movements, sales] = await Promise.all([
    db.cashMovement.findMany({
      where: { tenantId, cashSessionId },
    }),
    db.sale.findMany({
      where: { tenantId, cashSessionId, status: "PAID" },
      include: { payments: true },
    }),
  ]);

  const supplyInCents = movements
    .filter((movement) => movement.type === "SUPPLY")
    .reduce((total, movement) => total + movement.amountInCents, 0);
  const withdrawalInCents = movements
    .filter((movement) => movement.type === "WITHDRAWAL")
    .reduce((total, movement) => total + movement.amountInCents, 0);
  const cashPaymentsInCents = sales
    .flatMap((sale) => sale.payments)
    .filter((payment) => payment.method === "CASH" && payment.status === "APPROVED")
    .reduce((total, payment) => total + payment.amountInCents, 0);
  const changeInCents = sales.reduce((total, sale) => total + sale.changeInCents, 0);

  return openingAmountInCents + supplyInCents - withdrawalInCents + cashPaymentsInCents - changeInCents;
};
