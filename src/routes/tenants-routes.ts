import { fromNodeHeaders } from "better-auth/node";
import { IncomingHttpHeaders } from "node:http";

import { FastifyInstance, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import { auth } from "../lib/auth.js";
import { resolveTenantRequestInput } from "../lib/tenant.js";
import {
  DeleteTenantResponseSchema,
  ErrorSchema,
  ListTenantsResponseSchema,
  ProvisionTenantResponseSchema,
  ProvisionTenantSchema,
  ResolvedTenantQuerySchema,
  TenantPublicSchema,
  UpdateTenantSchema,
} from "../schemas/index.js";
import { DeleteTenant } from "../use-cases/DeleteTenant.js";
import { GetTenantPublicContext } from "../use-cases/GetTenantPublicContext.js";
import { ListTenantsPublicContext } from "../use-cases/ListTenantsPublicContext.js";
import { ProvisionTenant } from "../use-cases/ProvisionTenant.js";
import { UpdateTenant } from "../use-cases/UpdateTenant.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";

const ADMIN_ACCESS_EMAIL = "admin@pdv.local";

const assertRootAdmin = async (
  headers: IncomingHttpHeaders,
  reply: FastifyReply,
): Promise<boolean> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });

  if (!session?.user?.id) {
    sendUnauthorized(reply);
    return false;
  }

  const isRootAdmin =
    session.user.email?.toLowerCase() === ADMIN_ACCESS_EMAIL &&
    (session.user.role === "ADMIN" || session.user.role === undefined);

  if (!isRootAdmin) {
    reply.status(403).send({
      error: "Forbidden",
      code: "FORBIDDEN",
    });
    return false;
  }

  return true;
};

export const tenantsRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Tenants"],
      summary: "List registered tenants public context",
      response: {
        200: ListTenantsResponseSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        if (!(await assertRootAdmin(request.headers, reply))) {
          return;
        }

        const listTenantsPublicContext = new ListTenantsPublicContext();
        const tenants = await listTenantsPublicContext.execute();
        return reply.send({ tenants });
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:tenantId",
    schema: {
      tags: ["Tenants"],
      summary: "Update tenant public context",
      params: z.object({ tenantId: z.string().trim().min(2).max(48) }),
      body: UpdateTenantSchema,
      response: {
        200: TenantPublicSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        if (!(await assertRootAdmin(request.headers, reply))) {
          return;
        }

        const updateTenant = new UpdateTenant();
        const tenant = await updateTenant.execute({
          tenantId: request.params.tenantId,
          ...request.body,
        });

        return reply.send(tenant);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/:tenantId",
    schema: {
      tags: ["Tenants"],
      summary: "Delete tenant",
      params: z.object({ tenantId: z.string().trim().min(2).max(48) }),
      response: {
        200: DeleteTenantResponseSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        if (!(await assertRootAdmin(request.headers, reply))) {
          return;
        }

        const deleteTenant = new DeleteTenant();
        return reply.send(
          await deleteTenant.execute({
            tenantId: request.params.tenantId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/resolve",
    schema: {
      tags: ["Tenants"],
      summary: "Resolve tenant public context by id, slug, headers or subdomain",
      querystring: ResolvedTenantQuerySchema,
      response: {
        200: z.object({ tenant: TenantPublicSchema }),
        400: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const requestTenant = resolveTenantRequestInput(request.headers);
        const getTenantPublicContext = new GetTenantPublicContext();
        const tenant = await getTenantPublicContext.execute({
          tenantId: request.query.tenantId ?? requestTenant.tenantId,
          tenantSlug: request.query.slug ?? requestTenant.tenantSlug,
        });

        return reply.send({ tenant });
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Tenants"],
      summary: "Provision a tenant with its initial administrator",
      body: ProvisionTenantSchema,
      response: {
        201: ProvisionTenantResponseSchema,
        400: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const provisionTenant = new ProvisionTenant();
        const result = await provisionTenant.execute(request.body);

        return reply.status(201).send(result);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
