import { Cache } from './cache.js';
import test from 'ava';

test('Add a new file', t => {
    const target = new Cache({
        'src/index.ts': 'aaa',
        'src/lib/foo.ts': 'foo',
        'src/lib/bar.ts': 'bar',
    });
    
    const changes = new Cache({
        'src/index.ts': 'aaa',
        'src/lib/foo.ts': 'foo',
        'src/lib/bar.ts': 'bar',
        'src/lib/baz.ts': 'baz',
    });

    const diff = target.diff(changes);
    t.deepEqual(diff, {
        created: [ 'src/lib/baz.ts' ],
        updated: [],
        deleted: [],
    });
});

test('Update a file', t => {
    const target = new Cache({
        'src/index.ts': 'aaa',
        'src/lib/foo.ts': 'foo',
        'src/lib/bar.ts': 'bar',
    });
    
    const changes = new Cache({
        'src/index.ts': 'ñee',
        'src/lib/foo.ts': 'foo',
        'src/lib/bar.ts': 'bar',
    });

    const diff = target.diff(changes);
    t.deepEqual(diff, {
        created: [],
        updated: [ 'src/index.ts' ],
        deleted: [],
    });
});

test('Delete a file', t => {
    const target = new Cache({
        'src/index.ts': 'aaa',
        'src/lib/foo.ts': 'foo',
        'src/lib/bar.ts': 'bar',
    });
    
    const changes = new Cache({
        'src/index.ts': 'aaa',
        'src/lib/bar.ts': 'bar',
    });

    const diff = target.diff(changes);
    t.deepEqual(diff, {
        created: [],
        updated: [],
        deleted: [ 'src/lib/foo.ts' ],
    });
});