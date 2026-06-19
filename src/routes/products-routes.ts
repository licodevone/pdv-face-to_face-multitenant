import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import {
  CreateProductSchema,
  DeleteProductResponseSchema,
  ErrorSchema,
  ProductListQuerySchema,
  ProductSchema,
  UpdateProductStockSchema,
  UpdateProductSchema,
} from "../schemas/index.js";
import { AdjustProductStock } from "../use-cases/AdjustProductStock.js";
import { CreateProduct } from "../use-cases/CreateProduct.js";
import { DeleteProduct } from "../use-cases/DeleteProduct.js";
import { GetProduct } from "../use-cases/GetProduct.js";
import { ListProducts } from "../use-cases/ListProducts.js";
import { UpdateProduct } from "../use-cases/UpdateProduct.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const productsRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Products"],
      summary: "List products and stock status",
      querystring: ProductListQuerySchema,
      response: {
        200: z.object({ products: ProductSchema.array() }),
        401: ErrorSchema,
        403: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const listProducts = new ListProducts();
        return reply.send(
          await listProducts.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            ...request.query,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:productId",
    schema: {
      tags: ["Products"],
      summary: "Get a product by id",
      params: z.object({ productId: z.uuid() }),
      response: {
        200: ProductSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const getProduct = new GetProduct();
        return reply.send(
          await getProduct.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            productId: request.params.productId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Products"],
      summary: "Create a product",
      body: CreateProductSchema,
      response: {
        201: ProductSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const createProduct = new CreateProduct();
        const product = await createProduct.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          ...request.body,
        });

        return reply.status(201).send(product);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:productId",
    schema: {
      tags: ["Products"],
      summary: "Update a product",
      params: z.object({ productId: z.uuid() }),
      body: UpdateProductSchema,
      response: {
        200: ProductSchema,
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
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const updateProduct = new UpdateProduct();
        return reply.send(
          await updateProduct.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            productId: request.params.productId,
            ...request.body,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:productId/stock",
    schema: {
      tags: ["Products"],
      summary: "Adjust a product stock quantity",
      params: z.object({ productId: z.uuid() }),
      body: UpdateProductStockSchema,
      response: {
        200: ProductSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const adjustProductStock = new AdjustProductStock();
        return reply.send(
          await adjustProductStock.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            productId: request.params.productId,
            ...request.body,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/:productId",
    schema: {
      tags: ["Products"],
      summary: "Delete a product",
      params: z.object({ productId: z.uuid() }),
      response: {
        200: DeleteProductResponseSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const deleteProduct = new DeleteProduct();
        return reply.send(
          await deleteProduct.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            productId: request.params.productId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
