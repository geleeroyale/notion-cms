interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;

  constructor(ttlSeconds: number = 300) {
    this.defaultTTL = ttlSeconds * 1000;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl ? ttl * 1000 : this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
