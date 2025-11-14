import type { DirentObject } from './dirent.object.js';
import type { HashObject } from './hash.object.js';

export interface LoadCacheInject {
    glob?(
        pattern: string | string[],
        o: {
            exclude?: string[];
            withFileTypes: true;
        }
    ): NodeJS.AsyncIterator<DirentObject>;

    createHash?(
        algorithm: string,
        o?: {
            outputLength?: number;
        }
    ): HashObject;

    readFile?(path: string): Promise<Buffer>;
}