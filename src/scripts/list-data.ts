import { prisma } from "../lib/db.js";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatMoney = (valueInCents: number) => moneyFormatter.format(valueInCents / 100);
const TENANT_ID = process.env.TENANT_ID ?? "default";

const [users, products, customers, cashSessions, sales] = await Promise.all([
  prisma.user.findMany({
    where: { tenantId: TENANT_ID },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accounts: {
        select: { providerId: true, password: true },
      },
    },
    orderBy: { email: "asc" },
  }),
  prisma.product.findMany({
    where: { tenantId: TENANT_ID },
    select: {
      sku: true,
      name: true,
      priceInCents: true,
      stockQuantity: true,
      minimumStock: true,
    },
    orderBy: { name: "asc" },
    take: 20,
  }),
  prisma.customer.findMany({
    where: { tenantId: TENANT_ID },
    select: {
      name: true,
      cpf: true,
      phone: true,
      loyaltyCode: true,
    },
    orderBy: { name: "asc" },
    take: 20,
  }),
  prisma.cashRegisterSession.findMany({
    where: { tenantId: TENANT_ID },
    select: {
      id: true,
      status: true,
      openingAmountInCents: true,
      openedAt: true,
    },
    orderBy: { openedAt: "desc" },
    take: 5,
  }),
  prisma.sale.findMany({
    where: { tenantId: TENANT_ID },
    select: {
      number: true,
      totalInCents: true,
      fiscalStatus: true,
      deliveryRequired: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  }),
]);

console.log("\nUsuários");
console.table(
  users.map((user) => ({
    nome: user.name,
    email: user.email,
    perfil: user.role,
    temSenha: user.accounts.some(
      (account) => account.providerId === "credential" && Boolean(account.password),
    ),
  })),
);

console.log("\nProdutos");
console.table(
  products.map((product) => ({
    sku: product.sku,
    nome: product.name,
    preco: formatMoney(product.priceInCents),
    estoque: Number(product.stockQuantity),
    minimo: Number(product.minimumStock),
  })),
);

console.log("\nClientes");
console.table(customers);

console.log("\nCaixas");
console.table(
  cashSessions.map((session) => ({
    id: session.id,
    status: session.status,
    abertura: formatMoney(session.openingAmountInCents),
    abertoEm: session.openedAt.toISOString(),
  })),
);

console.log("\nVendas");
console.table(
  sales.map((sale) => ({
    numero: sale.number,
    total: formatMoney(sale.totalInCents),
    fiscal: sale.fiscalStatus,
    delivery: sale.deliveryRequired,
    criadaEm: sale.createdAt.toISOString(),
  })),
);

await prisma.$disconnect();
