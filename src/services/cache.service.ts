import Redis from "ioredis";
import { logger } from "@/lib/logger";
import { BaseService } from "./base.service";

type CacheValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export class CacheService extends BaseService {
  private redis: Redis | null = null;
  private enabled: boolean;
  private defaultTTL: number;
  private prefix: string;
  private isConnected: boolean = false;

  constructor() {
    super("CacheService");
    this.enabled = process.env.REDIS_ENABLED !== "false";
    this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL ?? "300", 10);
    this.prefix = process.env.CACHE_PREFIX ?? "futboss:";
    this.initialize();
  }

  private initialize(): void {
    if (!this.enabled) {
      this.logInfo("Redis caching is disabled");
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on("connect", () => {
        this.isConnected = true;
        this.logInfo("Connected to Redis");
      });

      this.redis.on("error", (error) => {
        this.isConnected = false;
        this.logError("Redis connection error", { error: error.message });
      });

      this.redis.on("close", () => {
        this.isConnected = false;
        this.logWarn("Redis connection closed");
      });

      if (process.env.NODE_ENV !== "test") {
        this.redis.connect().catch((err) => {
          this.logWarn("Failed to connect to Redis, caching disabled", {
            error: (err as Error).message,
          });
          this.isConnected = false;
        });
      }
    } catch (error) {
      this.logWarn("Redis initialization failed, caching disabled", {
        error: (error as Error).message,
      });
      this.isConnected = false;
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isReady(): boolean {
    return this.enabled && this.isConnected && this.redis !== null;
  }

  async get<T = CacheValue>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const fullKey = this.getFullKey(key);
      const value = await this.redis!.get(fullKey);
      if (!value) return null;

      const parsed = JSON.parse(value) as T;
      return parsed;
    } catch (error) {
      this.logWarn("Cache get failed", { key, error: (error as Error).message });
      return null;
    }
  }

  async set(
    key: string,
    value: CacheValue,
    ttl?: number,
  ): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(value);
      const ttlToUse = ttl ?? this.defaultTTL;

      if (ttlToUse > 0) {
        await this.redis!.setex(fullKey, ttlToUse, serialized);
      } else {
        await this.redis!.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      this.logWarn("Cache set failed", { key, error: (error as Error).message });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const fullKey = this.getFullKey(key);
      await this.redis!.del(fullKey);
      return true;
    } catch (error) {
      this.logWarn("Cache delete failed", { key, error: (error as Error).message });
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.isReady()) return 0;

    try {
      const fullPattern = this.getFullKey(pattern);
      const stream = this.redis!.scanStream({
        match: fullPattern,
        count: 100,
      });

      let deletedCount = 0;
      const pipeline = this.redis!.pipeline();

      return new Promise<number>((resolve, reject) => {
        stream.on("data", (keys: string[]) => {
          if (keys.length > 0) {
            keys.forEach((key) => pipeline.del(key));
            deletedCount += keys.length;
          }
        });

        stream.on("end", async () => {
          if (deletedCount > 0) {
            await pipeline.exec();
          }
          resolve(deletedCount);
        });

        stream.on("error", (err) => {
          reject(err);
        });
      });
    } catch (error) {
      this.logWarn("Cache deletePattern failed", { pattern, error: (error as Error).message });
      return 0;
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    if (this.isReady()) {
      const cached = await this.get<T>(key);
      if (cached !== null) return cached;
    }

    const value = await fetchFn();

    if (this.isReady()) {
      await this.set(key, value as CacheValue, ttl);
    }

    return value;
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redis!.exists(fullKey);
      return result === 1;
    } catch {
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isReady()) return -2;

    try {
      const fullKey = this.getFullKey(key);
      return await this.redis!.ttl(fullKey);
    } catch {
      return -2;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.redis!.flushdb();
      this.logInfo("Cache flushed");
      return true;
    } catch (error) {
      this.logError("Cache flush failed", { error: (error as Error).message });
      return false;
    }
  }

  async increment(key: string, by: number = 1): Promise<number | null> {
    if (!this.isReady()) return null;

    try {
      const fullKey = this.getFullKey(key);
      return await this.redis!.incrby(fullKey, by);
    } catch (error) {
      this.logWarn("Cache increment failed", { key, error: (error as Error).message });
      return null;
    }
  }

  buildKey(...parts: string[]): string {
    return parts.filter(Boolean).join(":");
  }

  invalidateCompetition(slug: string): Promise<number> {
    return this.deletePattern(`competition:${slug}:*`);
  }

  invalidateTeam(slug: string): Promise<number> {
    return this.deletePattern(`team:${slug}:*`);
  }

  invalidatePlayer(slug: string): Promise<number> {
    return this.deletePattern(`player:${slug}:*`);
  }

  invalidateMatch(id: string): Promise<number> {
    return this.deletePattern(`match:${id}:*`);
  }

  invalidateUser(id: string): Promise<number> {
    return this.deletePattern(`user:${id}:*`);
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
