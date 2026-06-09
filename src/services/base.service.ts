import { logger } from "@/lib/logger";
import { successResult, errorResult, type ServiceResult } from "@/types";

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string = "SERVICE_ERROR",
    public statusCode: number = 500,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NotFoundServiceError extends ServiceError {
  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} '${identifier}' not found`
        : `${resource} not found`,
      "NOT_FOUND",
      404,
    );
    this.name = "NotFoundServiceError";
  }
}

export class ValidationServiceError extends ServiceError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationServiceError";
  }
}

export class UnauthorizedServiceError extends ServiceError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedServiceError";
  }
}

export class ConflictServiceError extends ServiceError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictServiceError";
  }
}

export abstract class BaseService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  protected logInfo(message: string, meta?: Record<string, unknown>): void {
    logger.info(`[${this.serviceName}] ${message}`, meta);
  }

  protected logWarn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(`[${this.serviceName}] ${message}`, meta);
  }

  protected logError(message: string, meta?: Record<string, unknown>): void {
    logger.error(`[${this.serviceName}] ${message}`, meta);
  }

  protected handleServiceError(error: unknown, operation: string): never {
    if (error instanceof ServiceError) {
      this.logWarn(`Operation '${operation}' failed`, {
        code: error.code,
        message: error.message,
      });
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    this.logError(`Operation '${operation}' failed`, { error: message });

    throw new ServiceError(
      `Service error in ${operation}: ${message}`,
      "INTERNAL_ERROR",
      500,
      error,
    );
  }

  protected wrapResult<T>(fn: () => Promise<T>): Promise<ServiceResult<T>> {
    return (async () => {
      try {
        const data = await fn();
        return successResult(data) as ServiceResult<T>;
      } catch (error) {
        if (error instanceof ServiceError) {
          return errorResult(error.message, error.code) as ServiceResult<T>;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        this.logError(`Operation '${this.serviceName}' failed`, { error: message });
        return errorResult(message, "INTERNAL_ERROR") as ServiceResult<T>;
      }
    })() as Promise<ServiceResult<T>>;
  }

  protected async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      return this.handleServiceError(error, this.serviceName);
    }
  }
}

export default BaseService;
