import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { PaginationParams, PaginatedResult } from "@/types";
import { buildPaginationQuery, buildPaginatedResult } from "@/types";

export type PrismaDelegate = {
  findMany: (args: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  findFirst: (args: unknown) => Promise<unknown | null>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  count: (args: unknown) => Promise<number>;
  upsert: (args: unknown) => Promise<unknown>;
  deleteMany: (args: unknown) => Promise<{ count: number }>;
  updateMany: (args: unknown) => Promise<{ count: number }>;
  createMany: (args: unknown) => Promise<{ count: number }>;
};

export class RepositoryError extends Error {
  constructor(
    message: string,
    public code: string = "REPOSITORY_ERROR",
    public cause?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class NotFoundError extends RepositoryError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      "NOT_FOUND",
    );
    this.name = "NotFoundError";
  }
}

export class DuplicateError extends RepositoryError {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      "DUPLICATE",
    );
    this.name = "DuplicateError";
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class BaseRepository<T, TCreate, TUpdate> {
  protected prisma: PrismaClient;
  protected delegate: PrismaDelegate;
  protected modelName: string;

  constructor(modelName: string, delegate: PrismaDelegate) {
    this.prisma = prisma;
    this.delegate = delegate;
    this.modelName = modelName;
  }

  protected handleError(error: unknown, operation: string): never {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Repository ${this.modelName}.${operation} failed`, {
      error: message,
    });

    if (error instanceof RepositoryError) {
      throw error;
    }

    if ((error as { code?: string })?.code === "P2002") {
      throw new DuplicateError(this.modelName, "field", "value");
    }

    if ((error as { code?: string })?.code === "P2025") {
      throw new NotFoundError(this.modelName);
    }

    throw new RepositoryError(
      `Failed to ${operation}: ${message}`,
      "OPERATION_FAILED",
      error,
    );
  }

  async findById(id: string): Promise<T> {
    try {
      const result = await this.delegate.findUnique({
        where: { id },
      });

      if (!result) {
        throw new NotFoundError(this.modelName, id);
      }

      return result as T;
    } catch (error) {
      this.handleError(error, "findById");
    }
  }

  async findMany(
    params: PaginationParams,
    where?: Record<string, unknown>,
    include?: Record<string, unknown>,
  ): Promise<PaginatedResult<T>> {
    try {
      const { skip, take, orderBy } = buildPaginationQuery(params);

      const [data, total] = await Promise.all([
        this.delegate.findMany({
          skip,
          take,
          where,
          orderBy,
          include,
        }),
        this.delegate.count({ where }),
      ]);

      return buildPaginatedResult(data as T[], total, params);
    } catch (error) {
      this.handleError(error, "findMany");
    }
  }

  async create(data: TCreate): Promise<T> {
    try {
      const result = await this.delegate.create({ data });
      return result as T;
    } catch (error) {
      this.handleError(error, "create");
    }
  }

  async update(id: string, data: TUpdate): Promise<T> {
    try {
      const result = await this.delegate.update({
        where: { id },
        data,
      });
      return result as T;
    } catch (error) {
      this.handleError(error, "update");
    }
  }

  async delete(id: string): Promise<T> {
    try {
      const result = await this.delegate.delete({ where: { id } });
      return result as T;
    } catch (error) {
      this.handleError(error, "delete");
    }
  }

  async upsert(
    where: Record<string, unknown>,
    create: TCreate,
    update: TUpdate,
  ): Promise<T> {
    try {
      const result = await this.delegate.upsert({ where, create, update });
      return result as T;
    } catch (error) {
      this.handleError(error, "upsert");
    }
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    try {
      const count = await this.delegate.count({ where });
      return count > 0;
    } catch (error) {
      this.handleError(error, "exists");
    }
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    try {
      return await this.delegate.count({ where });
    } catch (error) {
      this.handleError(error, "count");
    }
  }

  async deleteMany(where: Record<string, unknown>): Promise<{ count: number }> {
    try {
      return await this.delegate.deleteMany({ where });
    } catch (error) {
      this.handleError(error, "deleteMany");
    }
  }

  async updateMany(
    where: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<{ count: number }> {
    try {
      return await this.delegate.updateMany({ where, data });
    } catch (error) {
      this.handleError(error, "updateMany");
    }
  }
}

export default BaseRepository;
