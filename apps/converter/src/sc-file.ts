import fs, { readFile, writeFile } from 'fs/promises';
import { createReadStream, ReadStream, readFileSync } from 'fs';
// import { FileReader } from './reader/file.reader';
import { Asset } from './entity/asset.entity';
import { BufferReader } from './buffer-reader';
import { Texture } from './entity/texture.entity';
import { Region } from './entity/region.entity';
import { Shape } from './entity/shape.entity';
import { Matrix } from './entity/matrix.entity';
import { MovieClip } from './entity/movie-clip.entity';
import { basename, join } from 'path';
import { ShapeRenderer } from './renderer/shape.renderer';
import { Matrix2x3 } from './entity/matrix2x3.entity';
import sharp from 'sharp';
import { MovieClipRenderer } from './renderer/movie-clip.renderer';
import { Renderer } from './interface/renderer.interface';

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
    this.isTextureFile = basename(file, '.sc').endsWith('_tex');

    try {
      const readStream: () => Promise<void> = async () => {
        const buffer = await readFile(file);
        const startIndex = buffer.indexOf(Buffer.from('START'));

        this.bufferReader = new BufferReader(
          Buffer.from(
            startIndex !== -1 ? buffer.subarray(0, startIndex) : buffer
          )
        );
      };

      await Promise.all([fs.access(file), readStream()]);
    } catch (error) {
      throw new Error(`File not found: ${file}`);
    }
  }

  public async saveShapes(): Promise<void> {
    if (!this.shapes.length) {
      return;
    }

    if (!this.textureLoaded) {
      throw new Error(
        'Texture not loaded. Please load the texture file before saving shapes.'
      );
    }

    console.log('> Saving shapes...');

    const texFilename = this.filePath.endsWith('_tex.sc')
      ? basename(this.filePath, '_tex.sc')
      : basename(this.filePath, '.sc');

    const outputPath = join(
      __dirname,
      '../../../../src/assets',
      `out/${texFilename}`
    );

    await fs.mkdir(join(outputPath, 'shapes'), { recursive: true });
    await fs.mkdir(join(outputPath, 'shapes/regions'), { recursive: true });

    const shapesRegionsSummary: any[] = [];

    for (let i = 0; i < this.shapes.length; i++) {
      const shape = this.shapes[i];

      if (!shape) {
        continue;
      }

      const renderedShape = new ShapeRenderer(shape);
      const shapeImage = await renderedShape.render(new Matrix2x3());

      const pngPath = join(outputPath, 'shapes', `${shape.id}.png`);
      await sharp(shapeImage.toBuffer())
        .png({
          compressionLevel: 6,
          colors: 256,
        })
        .toFile(pngPath);

      const regionsCount = shape.regions.length;
      const regionsSummary: any[] = [];

      for (let j = 0; j < regionsCount; j++) {
        const region = shape.regions[j];
        const renderedRegion = region.getImage();

        if (!renderedRegion) {
          continue;
        }

        const regionFileName = `${shape.id}_region_${j}.png`;
        const regionPngPath = join(
          outputPath,
          'shapes/regions',
          regionFileName
        );
        await writeFile(regionPngPath, renderedRegion.toBuffer('image/png'));

        regionsSummary.push({
          regionIndex: j,
          xyPoints: region.xyPoints,
          uvPoints: region.uvPoints,
          textureIndex: region.textureIndex,
          mirrored: region.isMirrored,
          rotation: region.rotation,
          imageFile: regionFileName,
          pointCount: region.pointCount,
        });
      }
      shapesRegionsSummary.push({
        shapeId: shape.id,
        regions: regionsSummary,
      });
    }

    const summaryPath = join(outputPath, 'shapes', 'shapes_regions.json');
    await writeFile(summaryPath, JSON.stringify(shapesRegionsSummary, null, 2));
  }

  public async saveMovieClips(): Promise<void> {
    if (!this.movieClips.length) {
      return;
    }

    console.log('> Saving movie clips...');

    const texFilename = this.filePath.endsWith('_tex.sc')
      ? basename(this.filePath, '_tex.sc')
      : basename(this.filePath, '.sc');

    const outputPath = join(
      __dirname,
      '../../../../src/assets',
      `out/${texFilename}`
    );

    await fs.mkdir(join(outputPath, 'movie_clips'), { recursive: true });

    for (const movieClip of this.movieClips) {
      const renderedMovieClip = new MovieClipRenderer(movieClip, this);
      const movieClipImage = await renderedMovieClip.render(new Matrix2x3());

      if (movieClipImage.width + movieClipImage.height < 2) {
        continue;
      }

      const clipName = movieClip.exportName || movieClip.id;

      const pngPath = join(outputPath, 'movie_clips', `${clipName}.png`);
      await sharp(movieClipImage.toBuffer())
        .png({
          compressionLevel: 6,
          colors: 256,
        })
        .toFile(pngPath);

      const mcFileName = `${movieClip.id}.json`;
      const mcFilePath = join(outputPath, 'movie_clips', mcFileName);
      await writeFile(mcFilePath, JSON.stringify(movieClip, null, 2));
    }
  }

  public getRendererItem(targetId: number, name?: string): Renderer | null {
    const shape = this.shapes.find((s) => s.id === targetId);

    if (shape) {
      return new ShapeRenderer(shape);
    }

    const movieClip = this.movieClips.find((mc) => mc.id === targetId);

    if (movieClip) {
      return new MovieClipRenderer(movieClip, this);
    }

    return null;
  }
}
