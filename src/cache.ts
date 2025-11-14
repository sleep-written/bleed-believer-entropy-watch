import type { LoadCacheInject, LoadCacheOptions, CacheDiff } from './interfaces/index.js';

import { loadCache } from './load-cache.js';

export class Cache {
    static async load(
        pattern: string | string[],
        options?: LoadCacheOptions,
        inject?: LoadCacheInject
    ): Promise<Cache> {
        const cache = await loadCache(pattern, options, inject);
        return new Cache(cache);
    }

    #cache: Map<string, string>;

    constructor(o?: Map<string, string> | Record<string, string>) {
        this.#cache = !(o instanceof Map)
        ?   new Map(Object.entries(o ?? {}))
        :   o;
    }

    diff(newerCache: Cache): CacheDiff {
        const diff: CacheDiff = {
            created: [],
            updated: [],
            deleted: []
        };

        for (const [ path, hash ] of this.#cache.entries()) {
            const newerHash = newerCache.#cache.get(path);
            if (typeof newerHash !== 'string') {
                diff.deleted.push(path);
            } else if (hash !== newerHash) {
                diff.updated.push(path);
            }

        }

        for (const path of newerCache.#cache.keys()) {
            if (!this.#cache.has(path)) {
                diff.created.push(path);
            }
        }

        return diff;
    }

    toJSON(): Record<string, string> {
        return Object.fromEntries(this.#cache.entries());
    }
}