export declare class SimpleCache {
    private cache;
    private defaultTTL;
    constructor(ttlSeconds?: number);
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): void;
    clear(): void;
    keys(): string[];
}
