import { FastifyInstance, FastifyReply } from "fastify";

import {
  BadRequestError,
  CashRegisterClosedError,
  ConflictError,
  ForbiddenError,
  InsufficientStockError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/index.js";

interface SendRouteErrorInput {
  app: FastifyInstance;
  reply: FastifyReply;
  error: unknown;
}

export const sendRouteError = ({ app, reply, error }: SendRouteErrorInput) => {
  app.log.error(error);

  if (error instanceof BadRequestError || error instanceof InsufficientStockError) {
    return reply.status(400).send({
      error: error.message,
      code: error instanceof InsufficientStockError ? "INSUFFICIENT_STOCK" : "BAD_REQUEST",
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      error: error.message,
      code: "UNAUTHORIZED",
    });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      error: error.message,
      code: "FORBIDDEN",
    });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      error: error.message,
      code: "NOT_FOUND_ERROR",
    });
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({
      error: error.message,
      code: "CONFLICT",
    });
  }

  if (error instanceof CashRegisterClosedError) {
    return reply.status(422).send({
      error: error.message,
      code: "CASH_REGISTER_CLOSED",
    });
  }

  return reply.status(500).send({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};

export const sendUnauthorized = (reply: FastifyReply) =>
  reply.status(401).send({
    error: "Unauthorized",
    code: "UNAUTHORIZED",
  });
