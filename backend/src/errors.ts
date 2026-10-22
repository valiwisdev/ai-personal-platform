import { STATUS_CODES } from "node:http";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export enum ErrorMessages {
  HistoryConflict = "Thread history changed during this run. Retry with the latest history.",
}

export class ConflictError extends Error {
  readonly statusCode = 409;
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = error.validation ? 400 : (error.statusCode ?? 500);
  if (statusCode >= 500) {
    request.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      error: STATUS_CODES[500],
      message: "Something went wrong.",
    });
  }
  return reply.code(statusCode).send({
    statusCode,
    error: STATUS_CODES[statusCode] ?? "Error",
    message: error.message,
  });
}
