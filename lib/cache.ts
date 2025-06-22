/**
 * Advanced caching system with multiple storage backends and TTL support
 */

interface CacheEntry<T = any> {
  value: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  serialize?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

interface CacheBackend {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, value: T, ttl?: number): Promise<void> | void;
  delete(key: string): Promise<boolean> | boolean;
  clear(): Promise<void> | void;
  has(key: string): Promise<boolean> | boolean;
  keys(): Promise<string[]> | string[];
  size(): Promise<number> | number;
}

/**
 * Memory cache backend with LRU eviction
 */
class MemoryCache implements CacheBackend {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl = 0): void {
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict least recently used items if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      ttl,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  keys(): string[] {
    // Clean expired entries first
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats, size: this.cache.size };
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl === 0) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl > 0 && now - entry.createdAt > entry.ttl) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Redis cache backend (placeholder for Redis integration)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<number>;
  flushall(): Promise<string>;
}

class RedisCache implements CacheBackend {
  private client: RedisClient; // Redis client would be injected
  private keyPrefix: string;

  constructor(client: RedisClient, keyPrefix = 'cache:') {
    this.client = client;
    this.keyPrefix = keyPrefix;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.keyPrefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = 0): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(this.keyPrefix + key, Math.ceil(ttl / 1000), serialized);
      } else {
        await this.client.set(this.keyPrefix + key, serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(this.keyPrefix + key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.client.keys(this.keyPrefix + '*');
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.keyPrefix + key);
      return result > 0;
    } catch (error) {
      console.error('Redis has error:', error);
      return false;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = await this.client.keys(this.keyPrefix + '*');
      return keys.map((key: string) => key.replace(this.keyPrefix, ''));
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      const keys = await this.client.keys(this.keyPrefix + '*');
      return keys.length;
    } catch (error) {
      console.error('Redis size error:', error);
      return 0;
    }
  }
}

/**
 * Main Cache class with multiple backends and advanced features
 */
class Cache {
  private backend: CacheBackend;
  private defaultTTL: number;
  private tags = new Map<string, Set<string>>(); // tag -> set of keys
  private keyTags = new Map<string, Set<string>>(); // key -> set of tags

  constructor(backend: CacheBackend, defaultTTL = 0) {
    this.backend = backend;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.backend.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl ?? this.defaultTTL;
      await this.backend.set(key, value, ttl);

      // Handle tags
      if (options.tags && options.tags.length > 0) {
        this.setTags(key, options.tags);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = await this.backend.delete(key);
      if (deleted) {
        this.removeTags(key);
      }
      return deleted;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      return await this.backend.has(key);
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.backend.clear();
      this.tags.clear();
      this.keyTags.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    try {
      return await this.backend.keys();
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    try {
      return await this.backend.size();
    } catch (error) {
      console.error('Cache size error:', error);
      return 0;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    let value = await this.get<T>(key);

    if (value === null) {
      value = await factory();
      await this.set(key, value, options);
    }

    return value;
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tags.get(tag);
    if (!keys) return 0;

    let deleted = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Invalidate cache entries by multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;
    for (const tag of tags) {
      totalDeleted += await this.invalidateByTag(tag);
    }
    return totalDeleted;
  }

  /**
   * Get cache statistics (if backend supports it)
   */
  getStats(): CacheStats | null {
    if (this.backend instanceof MemoryCache) {
      return this.backend.getStats();
    }
    return null;
  }

  /**
   * Warm up cache with multiple entries
   */
  async warmUp<T>(
    entries: Array<{ key: string; factory: () => Promise<T> | T; options?: CacheOptions }>
  ): Promise<void> {
    const promises = entries.map(async ({ key, factory, options }) => {
      try {
        const value = await factory();
        await this.set(key, value, options);
      } catch (error) {
        console.error(`Failed to warm up cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  /**
   * Batch set multiple keys
   */
  async mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    const promises = entries.map(({ key, value, options }) => this.set(key, value, options));
    await Promise.allSettled(promises);
  }

  /**
   * Set tags for a key
   */
  private setTags(key: string, tags: string[]): void {
    // Remove existing tags for this key
    this.removeTags(key);

    // Add new tags
    const tagSet = new Set(tags);
    this.keyTags.set(key, tagSet);

    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    }
  }

  /**
   * Remove tags for a key
   */
  private removeTags(key: string): void {
    const tags = this.keyTags.get(key);
    if (tags) {
      for (const tag of tags) {
        const keys = this.tags.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tags.delete(tag);
          }
        }
      }
      this.keyTags.delete(key);
    }
  }
}

/**
 * Cache decorator for methods
 */
export function cached(
  options: CacheOptions & { keyGenerator?: (...args: unknown[]) => string } = {}
) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const keyGenerator =
        options.keyGenerator ||
        ((...args) => `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`);
      const cacheKey = keyGenerator(...args);

      return cache.getOrSet(cacheKey, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Create cache instance based on environment
 */
function createCache(): Cache {
  const cacheType = process.env.CACHE_TYPE || 'memory';
  const defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '0');

  let backend: CacheBackend;

  switch (cacheType) {
    case 'redis':
      // In a real implementation, you would create a Redis client here
      // const redis = new Redis(process.env.REDIS_URL);
      // backend = new RedisCache(redis);
      console.warn('Redis cache not implemented, falling back to memory cache');
      backend = new MemoryCache(parseInt(process.env.CACHE_MAX_SIZE || '1000'));
      break;
    case 'memory':
    default:
      backend = new MemoryCache(parseInt(process.env.CACHE_MAX_SIZE || '1000'));
      break;
  }

  return new Cache(backend, defaultTTL);
}

// Global cache instance
export const cache = createCache();

// Export types and classes
export { Cache, MemoryCache, RedisCache };
export type { CacheBackend, CacheEntry, CacheOptions, CacheStats };

// Convenience functions
export const cacheUtils = {
  /**
   * Generate cache key from object
   */
  generateKey(prefix: string, obj: Record<string, any>): string {
    const sorted = Object.keys(obj)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = obj[key];
          return result;
        },
        {} as Record<string, any>
      );

    return `${prefix}:${Buffer.from(JSON.stringify(sorted)).toString('base64')}`;
  },

  /**
   * Cache with automatic invalidation
   */
  async cacheWithInvalidation<T>(
    key: string,
    factory: () => Promise<T> | T,
    invalidateAfter: number,
    options: CacheOptions = {}
  ): Promise<T> {
    const result = await cache.getOrSet(key, factory, options);

    // Set up automatic invalidation
    setTimeout(() => {
      cache.delete(key);
    }, invalidateAfter);

    return result;
  },

  /**
   * Cache with refresh ahead
   */
  async cacheWithRefresh<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttl: number,
    refreshThreshold = 0.8,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await cache.get<{ value: T; timestamp: number }>(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const shouldRefresh = age > ttl * refreshThreshold;

      if (shouldRefresh) {
        // Refresh in background
        Promise.resolve(factory())
          .then(newValue => {
            cache.set(key, { value: newValue, timestamp: Date.now() }, { ...options, ttl });
          })
          .catch(error => {
            console.error('Background cache refresh failed:', error);
          });
      }

      return cached.value;
    }

    // Cache miss, fetch and cache
    const value = await factory();
    await cache.set(key, { value, timestamp: Date.now() }, { ...options, ttl });
    return value;
  },
};
