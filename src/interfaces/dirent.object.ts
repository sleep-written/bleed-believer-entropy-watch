export interface DirentObject {
    name: string;
    isFile(): boolean;
    parentPath: string;
}