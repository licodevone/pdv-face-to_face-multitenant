import { IncomingHttpHeaders } from "node:http";

import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.js";
import { findTenant, resolveTenantRequestInput } from "../lib/tenant.js";

export interface SessionContext {
  userId: string;
  tenantId: string;
  tenantSlug: string;
}

export const getSessionContext = async (
  headers: IncomingHttpHeaders,
): Promise<SessionContext | null> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });

  const userId = session?.user.id;
  const tenantId = session?.user.tenantId;

  if (!userId || !tenantId) {
    return null;
  }

  const tenant = await findTenant({ tenantId });

  if (!tenant) {
    return null;
  }

  const requestedTenant = resolveTenantRequestInput(headers);

  if (requestedTenant.tenantId && requestedTenant.tenantId !== tenant.id) {
    return null;
  }

  if (requestedTenant.tenantSlug && requestedTenant.tenantSlug !== tenant.slug) {
    return null;
  }

  return { userId, tenantId: tenant.id, tenantSlug: tenant.slug };
};
