import Redis from "ioredis";
import { logger } from "@/lib/logger";
import { BaseService } from "./base.service";

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

export class RateLimiterService extends BaseService {
  private redis: Redis | null = null;
  private enabled: boolean;
  private isConnected: boolean = false;
  private defaults: RateLimitConfig;

  private static instances: Map<string, { counter: number; resetAt: number }> = new Map();

  constructor() {
    super("RateLimiterService");
    this.enabled = process.env.RATE_LIMIT_ENABLED !== "false";
    this.defaults = {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100", 10),
    };
    this.initialize();
  }

  private initialize(): void {
    if (!this.enabled) {
      this.logInfo("Rate limiting is disabled");
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy() {
          return null;
        },
        lazyConnect: true,
      });

      this.redis.on("connect", () => {
        this.isConnected = true;
      });

      this.redis.on("error", () => {
        this.isConnected = false;
      });

      if (process.env.NODE_ENV !== "test") {
        this.redis.connect().catch(() => {
          this.isConnected = false;
        });
      }
    } catch {
      this.isConnected = false;
    }
  }

  private getInMemoryCounter(key: string, windowMs: number, maxRequests: number): RateLimitResult {
    const now = Date.now();
    const entry = RateLimiterService.instances.get(key);

    if (!entry || now >= entry.resetAt) {
      RateLimiterService.instances.set(key, { counter: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    entry.counter++;
    return {
      allowed: entry.counter <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - entry.counter),
      resetAt: entry.resetAt,
    };
  }

  async check(
    key: string,
    config?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    try {
      const { windowMs, maxRequests } = { ...this.defaults, ...config };

      if (!this.enabled) {
        return { allowed: true, limit: maxRequests, remaining: maxRequests, resetAt: Date.now() + windowMs };
      }

      if (this.isConnected && this.redis) {
        return await this.checkRedis(key, windowMs, maxRequests);
      }

      return this.getInMemoryCounter(key, windowMs, maxRequests);
    } catch (error) {
      this.logWarn("Rate limit check failed, allowing request", { key, error: (error as Error).message });
      return { allowed: true, limit: 9999, remaining: 9999, resetAt: Date.now() + 60000 };
    }
  }

  private async checkRedis(
    key: string,
    windowMs: number,
    maxRequests: number,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}`;
    const resetAt = now + windowMs;

    const multi = this.redis!.multi();
    multi.incr(windowKey);
    multi.ttl(windowKey);

    const results = await multi.exec();
    if (!results) {
      return { allowed: true, limit: maxRequests, remaining: maxRequests, resetAt };
    }

    const current = results[0]?.[1] as number | undefined ?? 1;
    const ttl = results[1]?.[1] as number | undefined ?? -1;

    if (ttl === -1 || ttl === -2) {
      await this.redis!.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    const actualResetAt = ttl > 0 ? now + ttl * 1000 : resetAt;

    return {
      allowed: current <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt: actualResetAt,
    };
  }

  async reset(key: string): Promise<void> {
    if (this.isConnected && this.redis) {
      await this.redis.del(`ratelimit:${key}`);
    } else {
      RateLimiterService.instances.delete(key);
    }
  }
}

export const rateLimiterService = new RateLimiterService();
export default rateLimiterService;
