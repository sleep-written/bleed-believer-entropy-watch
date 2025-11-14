export interface HashObject {
    update(data: Buffer): HashObject;
    digest(encoding: BufferEncoding): string;
}