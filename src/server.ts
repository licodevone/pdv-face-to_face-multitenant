import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifyApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";

import { env, trustedOrigins } from "./env.js";
import { authRoutes } from "./routes/auth-routes.js";
import { cashRoutes } from "./routes/cash-routes.js";
import { categoriesRoutes } from "./routes/categories-routes.js";
import { customersRoutes } from "./routes/customers-routes.js";
import { deliveryRoutes } from "./routes/delivery-routes.js";
import { operatorsRoutes } from "./routes/operators-routes.js";
import { productsRoutes } from "./routes/products-routes.js";
import { reportsRoutes } from "./routes/reports-routes.js";
import { salesRoutes } from "./routes/sales-routes.js";
import { signaturesRoutes } from "./routes/signatures-routes.js";
import { tenantsRoutes } from "./routes/tenants-routes.js";

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler((error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      error: "Request validation error",
      code: "VALIDATION_ERROR",
      details: {
        issues: error.validation,
        method: request.method,
        url: request.url,
      },
    });
  }

  if (isResponseSerializationError(error)) {
    return reply.status(500).send({
      error: "Response serialization error",
      code: "RESPONSE_SERIALIZATION_ERROR",
      details: {
        issues: error.cause.issues,
        method: error.method,
        url: error.url,
      },
    });
  }

  app.log.error(error);
  return reply.status(500).send({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
});

// Nova função principal para empacotar os comandos assíncronos de forma segura para CommonJS (CJS)
async function startServer() {
  try {
    await app.register(cors, {
      origin: trustedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Tenant-Id",
        "X-Tenant-Slug",
      ],
      credentials: true,
      maxAge: 86_400,
    });

    await app.register(swagger, {
      openapi: {
        info: {
          title: "PDV Face Delivery API",
          description: "API REST para frente de caixa, estoque, caixa, delivery e relatórios.",
          version: "0.1.0",
        },
        servers: [{ url: env.BETTER_AUTH_URL }],
      },
      transform: jsonSchemaTransform,
    });

    await app.register(swaggerUi, {
      routePrefix: "/docs",
    });

    app.get("/health", async () => ({ status: "ok" }));
    app.get("/", async () => ({
      name: "PDV Face Delivery API",
      status: "ok",
      links: {
        swagger: "/docs",
        scalar: "/reference",
        openapiJson: "/openapi.json",
        betterAuthScalar: "/api/auth/reference",
        betterAuthOpenapiJson: "/api/auth/open-api/generate-schema",
      },
    }));
    app.get("/openapi.json", async () => app.swagger());

    await app.register(fastifyApiReference, {
      routePrefix: "/reference",
      configuration: {
        url: "/openapi.json",
      },
    });

    await app.register(authRoutes, { prefix: "/api/auth" });
    await app.register(tenantsRoutes, { prefix: "/tenants" });
    await app.register(categoriesRoutes, { prefix: "/categories" });
    await app.register(productsRoutes, { prefix: "/products" });
    await app.register(customersRoutes, { prefix: "/customers" });
    await app.register(operatorsRoutes, { prefix: "/operators" });
    await app.register(cashRoutes, { prefix: "/cash" });
    await app.register(salesRoutes, { prefix: "/sales" });
    await app.register(deliveryRoutes, { prefix: "/delivery-orders" });
    await app.register(signaturesRoutes, { prefix: "/signatures" });
    await app.register(reportsRoutes, { prefix: "/reports" });

    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor rodando com sucesso em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Inicializa a execução do servidor sem gerar "Top-level await" na compilação
startServer().catch((err) => {
  console.error("Erro fatal ao iniciar a aplicação:", err);
});
