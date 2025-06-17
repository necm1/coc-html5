export interface ScHeader {
  version: number;
  hash: string;
  needsDecompression: boolean;
  decompressStart: number;
  decompressEnd: number;
}
