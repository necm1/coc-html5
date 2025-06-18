import { HandlerRegistry } from './registry/handler.registry';
import { ProcessorRegistry } from './registry/processor.registry';
import { ScFile } from './sc-file';
import { BufferReader } from './buffer-reader';
import { BufferEmptyException } from './exception/buffer-empty.exception';
import { NoProcessorException } from './exception/no-processor.exception';
import { Asset } from './entity/asset.entity';
import { HandlerEventEmitter, HandlerEventType } from './handler.event-emitter';
import * as fs from 'fs/promises';
import { basename, join } from 'path';
import { ShapeRenderer } from './renderer/shape.renderer';
import { Matrix2x3 } from './entity/matrix2x3.entity';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import { ScProcessor } from './processor/sc.processor';
import { SigProcessor } from './processor/sig.processor';
import { ZstdProcessor } from './processor/zstd.processor';
import { SclzProcessor } from './processor/sclz.processor';
import { LzmaProcessor } from './processor/lzma.processor';
import { LzhamProcessor } from './processor/lzham.processor';
import { ShapeHandler } from './handler/shape.handler';
import { TextureHandler } from './handler/texture.handler';
import { NoTextureHandler } from './handler/no-texture.handler';
import { MovieClipsHandler } from './handler/movie-clips.handler';
import { MatrixHandler } from './handler/matrix.handler';
import { ResetMatrixHandler } from './handler/reset-matrix.handler';
import { UncommonTextureHandler } from './handler/uncommon-texture.handler';

export class ScDecoder {
  private _scFile: ScFile;
  private processorRegistry: ProcessorRegistry;
  private handlerRegistry: HandlerRegistry;

  constructor() {
    this.processorRegistry = new ProcessorRegistry();
    this.processorRegistry.register(new ScProcessor());
    this.processorRegistry.register(new SigProcessor());
    this.processorRegistry.register(new ZstdProcessor());
    this.processorRegistry.register(new SclzProcessor());
    this.processorRegistry.register(new LzmaProcessor());
    this.processorRegistry.register(new LzhamProcessor());

    this.handlerRegistry = new HandlerRegistry();
    this.handlerRegistry.register(new TextureHandler());
    this.handlerRegistry.register(new ShapeHandler());
    this.handlerRegistry.register(new MovieClipsHandler());
    this.handlerRegistry.register(new MatrixHandler());
    this.handlerRegistry.register(new NoTextureHandler());
    this.handlerRegistry.register(new ResetMatrixHandler());
    this.handlerRegistry.register(new UncommonTextureHandler());
  }

  public async decode(scFile: ScFile, isTexture = false): Promise<void> {
    this._scFile = scFile;

    if (!scFile.bufferReader) {
      throw new Error(
        'BufferReader is not initialized. Please load the file first.'
      );
    }

    if (
      !scFile.bufferReader.buffer ||
      scFile.bufferReader.buffer.length === 0
    ) {
      throw new BufferEmptyException();
    }

    console.log('> Decoding SC file...');
    await this.decodeMetadata(scFile);

    if (!this._scFile.textureLoaded) {
      const texPath = this._scFile.filePath.replace(/\.sc$/, '_tex.sc');
      await this._scFile.load(texPath);

      this._scFile.textureLoaded = true;
      this._scFile.hasTexture = true;

      await this.decode(this._scFile, true);
    }

    if (isTexture) {
      await this.saveShapes();
    }

    console.log('> SC file decoding completed.');
  }

  public async decodeMetadata(
    scFile = this._scFile,
    loadMetaTags = false
  ): Promise<void> {
    try {
      const processor = await this.processorRegistry.getItem(
        scFile.bufferReader
      );

      if (!processor) {
        return;
      }

      console.log(`> Found processor: ${processor.constructor.name}`);
      await processor.process(scFile);

      if (
        [ScProcessor.name, SigProcessor.name].includes(
          processor.constructor.name
        )
      ) {
        await this.decodeMetadata(scFile, true);
      }
    } catch (error) {
      if (error instanceof NoProcessorException) {
        return;
      }

      throw error;
    }

    if (loadMetaTags) {
      console.log('> Decoding metadata and tags...');
      if (!scFile.isTextureFile) {
        await this.decodeFileMetadata(scFile.bufferReader, scFile);
      }

      await this.loadTags(scFile);
    }
  }

  private async decodeFileMetadata(
    reader: BufferReader,
    scFile: ScFile
  ): Promise<void> {
    const metadata = scFile.metadata;

    metadata.SHAPES = reader.readUInt16LE();
    metadata.MOVIE_CLIPS = reader.readUInt16LE();
    metadata.TEXTURES = reader.readUInt16LE();
    metadata.TEXT_FIELDS = reader.readUInt16LE();
    metadata.TRANSFORM_MATRICES = reader.readUInt16LE();
    metadata.COLOR_TRANSFORMS = reader.readUInt16LE();

    scFile.matrix.load(metadata.TRANSFORM_MATRICES, metadata.COLOR_TRANSFORMS);
    scFile.matrices.push(scFile.matrix);

    reader.readUInt32LE();
    reader.readByte();

    metadata.EXPORTS = reader.readUInt16LE();

    console.log(
      `> Shapes: ${metadata.SHAPES}, Movie Clips: ${metadata.MOVIE_CLIPS}, Textures: ${metadata.TEXTURES}, Text Fields: ${metadata.TEXT_FIELDS}, Transform Matrices: ${metadata.TRANSFORM_MATRICES}, Color Transforms: ${metadata.COLOR_TRANSFORMS}, Exports: ${metadata.EXPORTS}`
    );

    const assets: { id: number; name?: string }[] = [];

    for (let i = 0; i < metadata.EXPORTS; i++) {
      assets.push({
        id: reader.readUInt16LE(),
      });
    }

    for (let i = 0; i < metadata.EXPORTS; i++) {
      assets[i].name = reader.readString();
    }

    for (const asset of assets) {
      if (!asset.name?.length) {
        console.warn(
          `Skipping asset with invalid id or name: ${JSON.stringify(asset)}`
        );
        continue;
      }

      const id = asset.id;
      const name = asset.name;
      scFile.assets[id] = new Asset({
        file: scFile,
        id,
        name,
      });
    }
  }

  private async saveShapes(): Promise<void> {
    if (!this._scFile.shapes.length) {
      return;
    }

    const texFilename = this._scFile.filePath.endsWith('_tex.sc')
      ? basename(this._scFile.filePath, '_tex.sc')
      : basename(this._scFile.filePath, '.sc');

    const outputPath = join(
      __dirname,
      '../../../../src/assets',
      `out/${texFilename}`
    );

    await fs.mkdir(join(outputPath, 'shapes'), { recursive: true });
    await fs.mkdir(join(outputPath, 'shapes/regions'), { recursive: true });

    const shapesRegionsSummary: any[] = [];

    for (let i = 0; i < this._scFile.shapes.length; i++) {
      const shape = this._scFile.shapes[i];

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
          imageFile: regionFileName,
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

  private async loadTags(scFile = this._scFile): Promise<boolean> {
    const reader = scFile.bufferReader;

    let textureId = 0;
    let shapesLoaded = 0;
    let matricesLoaded = 0;
    let movieClipsLoaded = 0;

    const afterHandleEvent = HandlerEventEmitter.getInstance().on(
      'afterHandle',
      (type: HandlerEventType, ...data: any) => {
        if (type === HandlerEventType.ADD_TEXTURE) {
          textureId++;
        }

        if (type === HandlerEventType.SHAPE_LOADED) {
          shapesLoaded++;
        }

        if (type === HandlerEventType.MOVIE_CLIP_LOADED) {
          movieClipsLoaded++;
        }

        if (type === HandlerEventType.RESET_MATRIX) {
          matricesLoaded = 0;
        }

        if (type === HandlerEventType.NO_TEXTURE && !scFile.isTextureFile) {
          scFile.hasTexture = false;
        }

        if (type === HandlerEventType.MATRIX_LOADED) {
          matricesLoaded++;
        }
      }
    );

    while (true) {
      const tag = reader.readByte();
      const length = reader.readUInt32LE();

      if (tag === 0) {
        return scFile.isTextureFile;
      }

      // console.log(
      //   `> Processing tag: ${tag}, length: ${length}, offset: ${reader.offset}`
      // );

      const handler = await this.handlerRegistry.getItem(tag);

      if (!handler) {
        // console.warn(`No handler found for tag: ${tag}, skipping ${length}`);
        reader.readBytes(length);
      }

      await handler?.handle({
        file: scFile,
        tag,
        hasTexture: scFile.hasTexture,
        textureId,
        shapesLoaded,
        matricesLoaded,
        length,
        movieClipsLoaded,
      });
    }
  }
}
