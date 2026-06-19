import dayjs from "dayjs";

import { prisma } from "../lib/db.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  from?: string;
  to?: string;
}

interface PeriodBucketOutputDto {
  totalInCents: number;
  salesCount: number;
}

interface OutputDto {
  from: string;
  to: string;
  grossSalesInCents: number;
  discountInCents: number;
  netSalesInCents: number;
  profitInCents: number;
  salesCount: number;
  averageTicketInCents: number;
  byPaymentMethod: Record<
    "CASH" | "CARD" | "PIX" | "STORE_CREDIT" | "DIGITAL_WALLET" | "CONTACTLESS",
    number
  >;
  daily: Array<{ date: string; totalInCents: number; salesCount: number }>;
  monthly: Array<{ month: string; totalInCents: number; salesCount: number }>;
}

const emptyPaymentTotals = {
  CASH: 0,
  CARD: 0,
  PIX: 0,
  STORE_CREDIT: 0,
  DIGITAL_WALLET: 0,
  CONTACTLESS: 0,
};

export class GetFinancialReport {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER"],
    });

    const from = dto.from ? dayjs(dto.from) : dayjs().startOf("day");
    const to = dto.to ? dayjs(dto.to) : dayjs();

    const sales = await prisma.sale.findMany({
      where: {
        tenantId: dto.tenantId,
        status: "PAID",
        createdAt: {
          gte: from.toDate(),
          lte: to.toDate(),
        },
      },
      include: { payments: true, items: true },
      orderBy: { createdAt: "asc" },
    });

    const grossSalesInCents = sales.reduce(
      (total, sale) => total + sale.subtotalInCents,
      0,
    );
    const discountInCents = sales.reduce(
      (total, sale) => total + sale.discountInCents,
      0,
    );
    const netSalesInCents = sales.reduce(
      (total, sale) => total + sale.totalInCents,
      0,
    );
    const costInCents = sales
      .flatMap((sale) => sale.items)
      .reduce(
        (total, item) => total + Math.round(item.unitCostInCents * Number(item.quantity)),
        0,
      );

    const byPaymentMethod = sales
      .flatMap((sale) => sale.payments)
      .filter((payment) => payment.status === "APPROVED")
      .reduce(
        (totals, payment) => ({
          ...totals,
          [payment.method]: totals[payment.method] + payment.amountInCents,
        }),
        { ...emptyPaymentTotals },
      );

    const dailyMap = sales.reduce((accumulator, sale) => {
      const date = dayjs(sale.createdAt).format("YYYY-MM-DD");
      const current = accumulator.get(date) ?? { totalInCents: 0, salesCount: 0 };
      accumulator.set(date, {
        totalInCents: current.totalInCents + sale.totalInCents,
        salesCount: current.salesCount + 1,
      });
      return accumulator;
    }, new Map<string, PeriodBucketOutputDto>());

    const monthlyMap = sales.reduce((accumulator, sale) => {
      const month = dayjs(sale.createdAt).format("YYYY-MM");
      const current = accumulator.get(month) ?? { totalInCents: 0, salesCount: 0 };
      accumulator.set(month, {
        totalInCents: current.totalInCents + sale.totalInCents,
        salesCount: current.salesCount + 1,
      });
      return accumulator;
    }, new Map<string, PeriodBucketOutputDto>());

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      grossSalesInCents,
      discountInCents,
      netSalesInCents,
      profitInCents: netSalesInCents - costInCents,
      salesCount: sales.length,
      averageTicketInCents:
        sales.length > 0 ? Math.round(netSalesInCents / sales.length) : 0,
      byPaymentMethod,
      daily: Array.from(dailyMap.entries()).map(([date, value]) => ({
        date,
        totalInCents: value.totalInCents,
        salesCount: value.salesCount,
      })),
      monthly: Array.from(monthlyMap.entries()).map(([month, value]) => ({
        month,
        totalInCents: value.totalInCents,
        salesCount: value.salesCount,
      })),
    };
  }
}
