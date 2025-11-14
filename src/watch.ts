import type { LoadCacheInject, LoadCacheOptions, WatchOptions } from './interfaces/index.js';

import { Cache } from './cache.js';

export class Watch {
    #fsCache?: Cache;
    #pattern: string | string[];
    #options?: WatchOptions;
    #inject?: LoadCacheInject;

    #createdCallback = new Set<(v: string[]) => void | Promise<void>>();
    #updatedCallback = new Set<(v: string[]) => void | Promise<void>>();
    #deletedCallback = new Set<(v: string[]) => void | Promise<void>>();
    #errorCallback = new Set<(e: Error) => void | Promise<void>>();
    #endCallback = new Set<() => void | Promise<void>>();

    #controller?: AbortController;
    get isRunning(): boolean {
        const signal = this.#controller?.signal;
        return !!signal && !signal.aborted;
    }

    constructor(
        pattern: string | string[],
        options?: WatchOptions,
        inject?: LoadCacheInject
    ) {
        this.#pattern = pattern;
        this.#options = options;
        this.#inject = inject;
    }

    on(name: 'created', callback: (v: string[]) => void | Promise<void>): void;
    on(name: 'updated', callback: (v: string[]) => void | Promise<void>): void;
    on(name: 'deleted', callback: (v: string[]) => void | Promise<void>): void;
    on(name: 'error',   callback: (e: Error) => void | Promise<void>): void;
    on(name: 'end',     callback: () => void | Promise<void>): void;
    on(name: string,    callback: (...a: any[]) => void | Promise<void>): void {
        switch (name) {
            case 'created': {
                this.#createdCallback.add(callback);
                break;
            }

            case 'updated': {
                this.#updatedCallback.add(callback);
                break;
            }

            case 'deleted': {
                this.#deletedCallback.add(callback);
                break;
            }

            case 'error': {
                this.#errorCallback.add(callback);
                break;
            }

            case 'end': {
                this.#endCallback.add(callback);
                break;
            }
        }
    }

    async #executeDiff(
        paths: string[],
        callbacks: Set<(v: string[]) => void | Promise<void>>
    ): Promise<void> {
        if (paths.length === 0) {
            return;
        }

        const promises = Array
            .from(callbacks)
            .map(async fn => {
                try {
                    await fn(paths);
                } catch (err: any) {
                    this.#errorCallback.forEach(fn => fn(err));
                }
            });

        await Promise.all(promises);
    }

    async #loop(): Promise<void> {
        const options: LoadCacheOptions = {
            exclude: this.#options?.exclude,
            algorithm: this.#options?.hashAlgorithm,
            outputLength: this.#options?.hashlength,
        };

        if (!this.#fsCache) {
            this.#fsCache = await Cache.load(this.#pattern, options, this.#inject);

        } else {
            const other = await Cache.load(this.#pattern, options, this.#inject);
            const diff = this.#fsCache.diff(other);
            await Promise.all([
                this.#executeDiff(diff.created, this.#createdCallback),
                this.#executeDiff(diff.updated, this.#updatedCallback),
                this.#executeDiff(diff.deleted, this.#deletedCallback),
            ]);

            this.#fsCache = other;
        }
    }

    stop(): void {
        this.#controller?.abort();
        this.#controller = undefined;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('The FSWatch instance is already running');
        }

        this.#controller = new AbortController;
        const signal = this.#controller.signal;
        while (!signal.aborted) {
            const timestamp = Date.now();
            await this.#loop();

            const limit = this.#options?.interval ?? 50;
            const diff = Date.now() - timestamp;
            if (diff < limit) {
                await new Promise(r => setTimeout(r, limit - diff));
            }
        }

        this.#controller = undefined;
        this.#endCallback.forEach(fn => fn());
    }
}