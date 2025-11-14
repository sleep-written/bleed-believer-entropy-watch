import type { DirentObject, LoadCacheInject } from './interfaces/index.js';
import { basename, dirname, resolve } from 'path';
import { Watch } from './watch.js';
import test from 'ava';

class Inject implements LoadCacheInject {
    #files: Record<string, string> = {};
    get files(): Record<string, string> {
        return this.#files;
    }

    constructor(files?: Record<string, string>) {
        if (files) {
            this.#files = files;
        }
    }

    async *glob(
        _: string | string[],
        __: {
            exclude?: string[];
            withFileTypes: true;
        }
    ): NodeJS.AsyncIterator<DirentObject> {
        for (const path of Object.keys(this.#files)) {
            yield {
                isFile: () => true,
                name: basename(path),
                parentPath: dirname(path)
            };
        }
    }

    async readFile(path: string): Promise<Buffer> {
        const text = this.#files[path];
        if (typeof text !== 'string') {
            throw new Error(`The file "${path}" doesn't exists`);
        }

        return Buffer.from(text, 'utf-8');
    }
}

test('Example', async t => {
    const inject = new Inject({
        [resolve('/project/src/index.ts')]: `console.log('index.ts');`,
        [resolve('/project/src/lib/foo.ts')]: `console.log('lib/foo.ts');`,
        [resolve('/project/src/lib/bar.ts')]: `console.log('lib/bar.ts');`,
    });

    const created: string[] = [];
    const updated: string[] = [];
    const deleted: string[] = [];

    const fsWatch = new Watch('./**/*.ts', undefined, inject);
    fsWatch.on('created', paths => { created.push(...paths); });
    fsWatch.on('updated', paths => { updated.push(...paths); });
    fsWatch.on('deleted', paths => { deleted.push(...paths); });

    setTimeout(
        () => {
            const path = resolve('/project/src/lib/baz.ts');
            inject.files[path] = `console.log('lib/baz.ts');`;
        },
        1_000
    );

    setTimeout(
        () => {
            const path = resolve('/project/src/lib/foo.ts');
            inject.files[path] = `console.log('lib/foo.ts jajaja');`;
        },
        2_000
    );

    setTimeout(
        () => {
            const path = resolve('/project/src/lib/bar.ts');
            delete inject.files[path];
        },
        3_000
    );

    setTimeout(
        () => {
            fsWatch.stop();
        },
        4_000
    );

    await fsWatch.start();

    t.deepEqual(created, [ resolve('/project/src/lib/baz.ts') ]);
    t.deepEqual(updated, [ resolve('/project/src/lib/foo.ts') ]);
    t.deepEqual(deleted, [ resolve('/project/src/lib/bar.ts') ]);
});