import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { ConflictError } from "../errors/index.js";
import { prisma } from "./db.js";
import { DEFAULT_TENANT_ID, ensureTenant } from "./tenant.js";

type CredentialDbClient = Pick<typeof prisma, "tenant" | "user" | "account">;

export interface EnsureCredentialUserInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  db?: CredentialDbClient;
}

export const ensureCredentialUser = async ({
  name,
  email,
  password,
  role,
  tenantId = DEFAULT_TENANT_ID,
  tenantSlug,
  tenantName,
  db = prisma,
}: EnsureCredentialUserInput) => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const tenant = await ensureTenant({
    tenantId,
    tenantSlug,
    name: tenantName,
    db,
  });

  const existingUserWithEmail = await db.user.findFirst({
    where: { email: normalizedEmail },
    select: { id: true, tenantId: true },
  });

  if (existingUserWithEmail && existingUserWithEmail.tenantId !== tenant.id) {
    throw new ConflictError("A user with this e-mail already belongs to another tenant");
  }

  const user = await db.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: normalizedEmail,
      },
    },
    update: {
      name: trimmedName,
      email: normalizedEmail,
      emailVerified: true,
      role,
      tenantId: tenant.id,
    },
    create: {
      id: randomUUID(),
      tenantId: tenant.id,
      name: trimmedName,
      email: normalizedEmail,
      emailVerified: true,
      role,
    },
  });

  const passwordHash = await hashPassword(password);

  await db.account.deleteMany({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  await db.account.create({
    data: {
      id: randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    },
  });

  return user;
};
