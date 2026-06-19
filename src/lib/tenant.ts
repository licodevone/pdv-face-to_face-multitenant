import { IncomingHttpHeaders } from "node:http";

import { BadRequestError, ConflictError, NotFoundError } from "../errors/index.js";
import { prisma } from "./db.js";

export const DEFAULT_TENANT_ID = "default";
export const DEFAULT_TENANT_SLUG = "default";
export const DEFAULT_TENANT_NAME = "Default Tenant";

const MIN_TENANT_TOKEN_LENGTH = 2;
const MAX_TENANT_TOKEN_LENGTH = 48;
const RESERVED_TENANT_SLUGS = new Set([
  "api",
  "auth",
  "docs",
  "health",
  "localhost",
  "openapi",
  "reference",
  "tenants",
  "www",
]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

type TenantDbClient = Pick<typeof prisma, "tenant">;

export interface TenantLookupInput {
  tenantId?: string;
  tenantSlug?: string;
}

export interface EnsureTenantInput extends TenantLookupInput {
  name?: string;
  isActive?: boolean;
  db?: TenantDbClient;
}

const capitalizeWord = (value: string) =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const buildNameFromSlug = (slug: string) =>
  slug
    .split("-")
    .filter((part) => part.length > 0)
    .map(capitalizeWord)
    .join(" ");

const normalizeTenantToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TENANT_TOKEN_LENGTH);

const getFirstHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const stripPort = (host: string) => {
  const normalizedHost = host.trim().toLowerCase();

  if (normalizedHost.startsWith("[")) {
    const closingIndex = normalizedHost.indexOf("]");
    return closingIndex === -1
      ? normalizedHost
      : normalizedHost.slice(1, closingIndex);
  }

  return normalizedHost.split(":")[0] ?? normalizedHost;
};

const extractTenantSlugFromHost = (hostHeader: string | undefined) => {
  if (!hostHeader) {
    return undefined;
  }

  const host = stripPort(hostHeader);

  if (!host || LOCAL_HOSTS.has(host)) {
    return undefined;
  }

  const labels = host.split(".").filter((label) => label.length > 0);
  const subdomainLabels = host.endsWith(".localhost")
    ? labels.slice(0, -1)
    : labels.length >= 3
      ? labels.slice(0, -2)
      : [];

  for (const label of subdomainLabels) {
    const candidate = normalizeTenantToken(label);

    if (
      candidate.length >= MIN_TENANT_TOKEN_LENGTH &&
      !RESERVED_TENANT_SLUGS.has(candidate)
    ) {
      return candidate;
    }
  }

  return undefined;
};

export const normalizeTenantId = (value: string) => normalizeTenantToken(value);

export const normalizeTenantSlug = (value: string) => normalizeTenantToken(value);

export const isReservedTenantSlug = (value: string) =>
  RESERVED_TENANT_SLUGS.has(normalizeTenantSlug(value));

export const buildTenantIdentity = ({
  tenantId,
  tenantSlug,
  name,
}: TenantLookupInput & { name?: string }) => {
  const normalizedTenantId = normalizeTenantId(
    tenantId ?? tenantSlug ?? name ?? DEFAULT_TENANT_ID,
  );
  const normalizedTenantSlug = normalizeTenantSlug(
    tenantSlug ?? tenantId ?? name ?? DEFAULT_TENANT_SLUG,
  );
  const tenantName = name?.trim() || buildNameFromSlug(normalizedTenantSlug) || DEFAULT_TENANT_NAME;

  if (normalizedTenantId.length < MIN_TENANT_TOKEN_LENGTH) {
    throw new BadRequestError("Tenant id must contain at least 2 valid characters");
  }

  if (normalizedTenantSlug.length < MIN_TENANT_TOKEN_LENGTH) {
    throw new BadRequestError("Tenant slug must contain at least 2 valid characters");
  }

  if (isReservedTenantSlug(normalizedTenantSlug)) {
    throw new BadRequestError("Tenant slug is reserved");
  }

  return {
    tenantId: normalizedTenantId,
    tenantSlug: normalizedTenantSlug,
    tenantName,
  };
};

export const resolveTenantRequestInput = (headers: IncomingHttpHeaders): TenantLookupInput => {
  const tenantId = getFirstHeaderValue(headers["x-tenant-id"]);
  const tenantSlug =
    getFirstHeaderValue(headers["x-tenant-slug"]) ??
    extractTenantSlugFromHost(getFirstHeaderValue(headers.host));

  return {
    tenantId: tenantId ? normalizeTenantId(tenantId) || undefined : undefined,
    tenantSlug: tenantSlug ? normalizeTenantSlug(tenantSlug) || undefined : undefined,
  };
};

export const ensureTenant = async ({
  tenantId,
  tenantSlug,
  name,
  isActive = true,
  db = prisma,
}: EnsureTenantInput) => {
  const identity = buildTenantIdentity({ tenantId, tenantSlug, name });
  const existingWithSlug = await db.tenant.findUnique({
    where: { slug: identity.tenantSlug },
    select: { id: true },
  });

  if (existingWithSlug && existingWithSlug.id !== identity.tenantId) {
    throw new ConflictError("Tenant slug already exists");
  }

  return db.tenant.upsert({
    where: { id: identity.tenantId },
    update: {
      slug: identity.tenantSlug,
      name: identity.tenantName,
      isActive,
    },
    create: {
      id: identity.tenantId,
      slug: identity.tenantSlug,
      name: identity.tenantName,
      isActive,
    },
  });
};

export const findTenant = async (
  {
    tenantId,
    tenantSlug,
    includeInactive = false,
    db = prisma,
  }: TenantLookupInput & { includeInactive?: boolean; db?: TenantDbClient },
) => {
  const normalizedTenantId = tenantId ? normalizeTenantId(tenantId) : undefined;
  const normalizedTenantSlug = tenantSlug ? normalizeTenantSlug(tenantSlug) : undefined;

  if (normalizedTenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: normalizedTenantId },
    });

    if (tenant && (includeInactive || tenant.isActive)) {
      return tenant;
    }
  }

  if (normalizedTenantSlug) {
    const tenant = await db.tenant.findUnique({
      where: { slug: normalizedTenantSlug },
    });

    if (tenant && (includeInactive || tenant.isActive)) {
      return tenant;
    }
  }

  return null;
};

export const findTenantOrThrow = async (
  input: TenantLookupInput & { includeInactive?: boolean; db?: TenantDbClient },
) => {
  const tenant = await findTenant(input);

  if (!tenant) {
    throw new NotFoundError("Tenant not found");
  }

  return tenant;
};
