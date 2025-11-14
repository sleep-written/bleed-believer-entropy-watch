import type { LoadCacheInject, DirentObject, HashObject } from './interfaces/index.js';

import { basename, dirname } from 'path';
import { loadCache } from './load-cache.js';
import test from 'ava';

class Hash implements HashObject {
    #algorithm: string;
    #data: Buffer = Buffer.from([]);

    constructor(algorithm: string) {
        this.#algorithm = algorithm;
    }

    update(data: Buffer): HashObject {
        this.#data = Buffer.concat([ this.#data, data ]);
        return this;
    }

    digest(encoding: BufferEncoding): string {
        const describe = [
            `Hash[algorithm=${this.#algorithm}`,
            `encoding=${encoding}]`
        ].join(';')

        return [
            this.#data.toString('utf-8'),
            describe
        ].join(' ');
    }
}

class Inject implements LoadCacheInject {
    fs: Record<string, string>;

    constructor(fs: Record<string, string>) {
        this.fs = fs;
    }

    async *glob(): AsyncGenerator<DirentObject> {
        for (const path of Object.keys(this.fs)) {
            yield {
                name: basename(path),
                isFile: () => true,
                parentPath: dirname(path)
            } as DirentObject;
        }
    }

    async readFile(path: string): Promise<Buffer> {
        if (this.fs[path]) {
            return Buffer.from(this.fs[path], 'utf-8');
        }

        throw new Error(`The file "${path}" is not found`);
    }

    createHash(algorithm: string): HashObject {
        return new Hash(algorithm);
    }
}

test('Load cache', async t => {
    const inject = new Inject({
        '/src/index.ts':   `console.log('index.ts');`,
        '/src/lib/foo.ts': `console.log('lib/foo.ts');`,
        '/src/lib/bar.ts': `console.log('lib/bar.ts');`,
    });

    const cache = await loadCache('./**/*.ts', {}, inject);
    t.like(Object.fromEntries(cache), {
        '/src/index.ts':   `console.log('index.ts'); Hash[algorithm=sha512;encoding=hex]`,
        '/src/lib/foo.ts': `console.log('lib/foo.ts'); Hash[algorithm=sha512;encoding=hex]`,
        '/src/lib/bar.ts': `console.log('lib/bar.ts'); Hash[algorithm=sha512;encoding=hex]`,
    });
});