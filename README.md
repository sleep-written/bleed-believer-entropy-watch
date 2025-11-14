# @bleed-believer/entropy-watch

## Installation
```shell
npm i --save @bleed-believer/entropy-watch
```

## Example
```ts
import { EntropyWatch } from '@bleed-believer/entropy-watch';

const watch = new EntropyWatch('./**/*.{ts,js}');
watch.on('created', paths => console.log('created:', paths));
watch.on('updated', paths => console.log('updated:', paths));
watch.on('deleted', paths => console.log('deleted:', paths));

process.once('SIGINT', () => {
    watch.stop();
});

await watch.start();
```

## Options
-   __exclude__ `string[]`:
    Glob patterns to exclude form the search (available from Node v23 and up).

-   __interval__ `number`:
    Polling rate in milliseconds, if not defined, the library uses `50ms`.

-   __hashlength__ `string`:
    The hashing algorithm, `sha512` as default. See [here](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options) for details.

-   __hashAlgorithm__ `number`:
    The hash length (for `shake256` algorithm).
