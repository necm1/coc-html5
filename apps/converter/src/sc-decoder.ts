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

export class ScDecoder {
  private _scFile: ScFile;

  constructor(
    private readonly processorRegistry: ProcessorRegistry,
    private readonly handlerRegistry: HandlerRegistry
  ) {}

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

    console.log('Decoding SC file...');
    await this.decodeMetadata(scFile);

    // if (!this._scFile.textureLoaded) {
    //   // this._texScFile = new ScFile(
    //   //   this._scFile.filePath.replace(/_tex\.sc$/, '.sc')
    //   // );
    //   // await this._texScFile.load();
    //   await this._scFile.load(
    //     this._scFile.filePath.replace(/_tex\.sc$/, '.sc')
    //   );
    //   this._scFile.textureLoaded = true;
    //   this._scFile.hasTexture = true;
    //   console.log('set file textureLoaded to true');

    //   await this.decode(this._scFile, true);
    // }

    // console.log(this._scFile.textures);

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

    console.log('SC file decoding completed.');
  }

  public async decodeMetadata(scFile = this._scFile): Promise<void> {
    console.log('Decoding metadata...');

    while (true) {
      try {
        const processor = await this.processorRegistry.getItem(
          scFile.bufferReader
        );

        if (!processor) {
          break;
        }

        // console.log(`Processor detected: ${processor.constructor.name}`);
        await processor.process(scFile);

        // console.log(`Decompressed length: ${scFile.bufferReader.length}`);
        // console.log(
        //   `Decompressed head: ${scFile.bufferReader.buffer
        //     .subarray(0, 32)
        //     .toString('hex')}`
        // );
        // console.log(`BufferReader offset: ${scFile.bufferReader.offset}`);
      } catch (error) {
        if (error instanceof NoProcessorException) {
          break;
        } else {
          console.error('Error during processing:', error);
          throw error;
        }
      }
    }

    if (!scFile.isTextureFile) {
      console.log('here decoding normal sc file');
      await this.decodeFileMetadata(scFile.bufferReader, scFile);
    }

    await this.loadTags(scFile);
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

    // scFile.shapes.concat(
    //   Array.from({ length: metadata.SHAPES }, () => new Shape())
    // );

    scFile.matrix.load(metadata.TRANSFORM_MATRICES, metadata.COLOR_TRANSFORMS);
    scFile.matrices.push(scFile.matrix);

    reader.readUInt32LE();
    reader.readByte();

    metadata.EXPORTS = reader.readUInt16LE();

    console.log(
      `Shapes: ${metadata.SHAPES}, Movie Clips: ${metadata.MOVIE_CLIPS}, Textures: ${metadata.TEXTURES}, Text Fields: ${metadata.TEXT_FIELDS}, Transform Matrices: ${metadata.TRANSFORM_MATRICES}, Color Transforms: ${metadata.COLOR_TRANSFORMS}, Exports: ${metadata.EXPORTS}`
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

    // Schreibe die Zusammenfassung als JSON-Datei
    const summaryPath = join(outputPath, 'shapes', 'shapes_regions.json');
    await writeFile(summaryPath, JSON.stringify(shapesRegionsSummary, null, 2));
  }

  private async loadTags(scFile = this._scFile): Promise<boolean> {
    const reader = scFile.bufferReader;

    // let hasTexture = scFile.isTextureFile ? true : true;
    let textureId = 0;
    let movieClipsLoaded = 0;
    let shapesLoaded = 0;
    let matricesLoaded = 0;

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
          // hasTexture = false;
        }

        if (type === HandlerEventType.MATRIX_LOADED) {
          matricesLoaded++;
        }
      }
    );

    while (true) {
      const tag = reader.readByte();
      const length = reader.readUInt32LE();

      if (!tag) {
        console.log(JSON.stringify(scFile.movieClips));
        return scFile.isTextureFile;
      }

      const handler = await this.handlerRegistry.getItem(tag);

      if (!handler) {
        reader.readBytes(length);
      }

      await handler?.handle({
        file: scFile,
        tag,
        hasTexture: scFile.hasTexture,
        textureId,
        length,
      });
    }
  }
}
