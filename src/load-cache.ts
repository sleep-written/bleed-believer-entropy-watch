import type { LoadCacheInject, LoadCacheOptions } from './interfaces/index.js';

import { glob, readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { resolve } from 'path';

export async function loadCache(
    pattern: string | string[],
    options?: LoadCacheOptions,
    inject?: LoadCacheInject
): Promise<Map<string, string>> {
    const createHashFn: LoadCacheInject['createHash'] = inject?.createHash?.bind(inject)  ?? createHash;
    const readFileFn:   LoadCacheInject['readFile']   = inject?.readFile?.bind(inject)    ?? readFile;
    const globFn:       LoadCacheInject['glob']       = inject?.glob?.bind(inject)        ?? glob;
    
    const iterator = globFn(pattern, {
        exclude: options?.exclude ?? [],
        withFileTypes: true
    });

    const cache = new Map<string, string>();
    for await (const dirent of iterator) {
        if (dirent.isFile()) {
            const args: [ string, { outputLength?: number }? ] = [
                options?.algorithm ?? 'sha512'
            ];

            if (typeof options?.outputLength === 'number') {
                args.push({ outputLength: options.outputLength });
            }

            const path = resolve(dirent.parentPath, dirent.name);
            const code = await readFileFn(path);
            const hash = createHashFn(...args)
                .update(code)
                .digest('hex');

            cache.set(path, hash);
        }
    }

    return cache;
}