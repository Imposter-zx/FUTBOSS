import { beforeAll, afterAll, vi } from "vitest"

const env = process.env as Record<string, string>;
env.DATABASE_URL = "postgresql://test:test@localhost:5432/futboss_test";
env.REDIS_URL = "redis://localhost:6379";
env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only-not-for-production";
env.NEXTAUTH_URL = "http://localhost:3000";
env["NODE_ENV"] = "test";
env.LOG_LEVEL = "error";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    competition: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    matchEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    standing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSubscription: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  },
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    competition: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    matchEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    standing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSubscription: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  },
}))

vi.mock("@/lib/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
    psubscribe: vi.fn(),
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      psubscribe: vi.fn(),
      publish: vi.fn(),
    })),
    ping: vi.fn().mockResolvedValue("PONG"),
    quit: vi.fn(),
    connect: vi.fn(),
  },
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
    psubscribe: vi.fn(),
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      psubscribe: vi.fn(),
      publish: vi.fn(),
    })),
    ping: vi.fn().mockResolvedValue("PONG"),
    quit: vi.fn(),
    connect: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  default: {
    authOptions: {
      providers: [],
      session: { strategy: "jwt" },
      callbacks: { jwt: vi.fn(), session: vi.fn() },
    },
  },
  authOptions: {
    providers: [],
    session: { strategy: "jwt" },
    callbacks: { jwt: vi.fn(), session: vi.fn() },
  },
  hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: vi.fn((password: string, hash: string) => Promise.resolve(hash === `hashed_${password}`)),
  getServerSession: vi.fn(),
}))

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

global.fetch = vi.fn()

beforeAll(() => {
  vi.useFakeTimers()
})

afterAll(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
