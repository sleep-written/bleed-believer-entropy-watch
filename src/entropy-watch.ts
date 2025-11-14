import type { WatchOptions } from './interfaces/index.js';
import { Watch } from './watch.js';

export class EntropyWatch extends Watch {
    constructor(
        pattern: string | string[],
        options?: WatchOptions
    ) {
        super(pattern, options);
    }
}