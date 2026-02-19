"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCache = void 0;
class SimpleCache {
    constructor(ttlSeconds = 300) {
        this.cache = new Map();
        this.defaultTTL = ttlSeconds * 1000;
    }
    set(key, value, ttl) {
        const expiry = Date.now() + (ttl ? ttl * 1000 : this.defaultTTL);
        this.cache.set(key, { data: value, expiry });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    has(key) {
        return this.get(key) !== null;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    keys() {
        return Array.from(this.cache.keys());
    }
}
exports.SimpleCache = SimpleCache;
