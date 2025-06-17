import fs, { readFile } from 'fs/promises';
import { createReadStream, ReadStream, readFileSync } from 'fs';
// import { FileReader } from './reader/file.reader';
import { Asset } from './entity/asset.entity';
import { BufferReader } from './buffer-reader';
import { Texture } from './entity/texture.entity';
import { Region } from './entity/region.entity';
import { Shape } from './entity/shape.entity';
import { Matrix } from './entity/matrix.entity';
import { MovieClip } from './entity/movie-clip.entity';
import { basename } from 'path';

type Metadata =
  | 'SHAPES'
  | 'MOVIE_CLIPS'
  | 'TEXTURES'
  | 'TEXT_FIELDS'
  | 'TRANSFORM_MATRICES'
  | 'COLOR_TRANSFORMS'
  | 'EXPORTS';

export class ScFile {
  public type?: string;
  public version: number | null;
  public fileHash?: string;

  public readonly metadata: Partial<Record<Metadata, any>> = {};
  public readonly resources: Record<string, any> = {};
  public readonly assets: Record<number, Asset> = {};

  public textures: Texture[] = [];
  public readonly regions: Region[] = [];
  public readonly shapes: Shape[] = [];
  public readonly movieClips: MovieClip[] = [];
  public readonly matrices: Matrix[] = [];
  public matrix = new Matrix();
  public readonly _chunks: Buffer[] = [];

  public hasTexture = true;
  public isTextureFile = false;
  public useCommonTexture = false;
  public useLowresTexture = false;
  public uncommonTexturePath: string | null = null;

  public lowResSuffix = '_lowres';
  public highResSuffix = '_highres';

  public textureLoaded = false;

  public bufferReader: BufferReader;
  public readerStream: ReadStream;

  constructor(public readonly filePath: string) {}

  public async load(file = this.filePath): Promise<void> {
    // const file = this.filePath;
    this.isTextureFile = basename(file, '.sc').endsWith('_tex');

    try {
      const readStream: () => Promise<void> = async () => {
        const buffer = await readFile(file);
        this.bufferReader = new BufferReader(Buffer.from(buffer));
      };

      await Promise.all([fs.access(file), readStream()]);
    } catch (error) {
      throw new Error(`File not found: ${file}`);
    }
  }
}
