import fs from 'fs';
import path from 'path';
import { ScFile } from './sc-file';
import { ProcessorRegistry } from './registry/processor.registry';
import { LzhamProcessor } from './processor/lzham.processor';
import { LzmaProcessor } from './processor/lzma.processor';
import { ZstdProcessor } from './processor/zstd.processor';
import { ScDecoder } from './sc-decoder';
import { HandlerRegistry } from './registry/handler.registry';
import { ShapeHandler } from './handler/shape.handler';
import { SclzProcessor } from './processor/sclz.processor';
import { ScProcessor } from './processor/sc.processor';
import { SigProcessor } from './processor/sig.processor';
import { TextureHandler } from './handler/texture.handler';
import { NoTextureHandler } from './handler/no-texture.handler';
import { MovieClipsHandler } from './handler/movie-clips.handler';
import { MatrixHandler } from './handler/matrix.handler';
import { ResetMatrixHandler } from './handler/reset-matrix.handler';
import { UncommonTextureHandler } from './handler/uncommon-texture.handler';

(async () => {
  console.log('Starting SC File Parser...');

  const ASSETS_PATH = path.join(__dirname, '../../../../src/assets');

  const file = path.join(ASSETS_PATH, 'sc/characters.sc');
  // const texFile = path.join(ASSETS_PATH, 'sc/characters_tex.sc');
  // const file = path.join(ASSETS_PATH, 'sc/buildings.sc');
  // const texFile = path.join(ASSETS_PATH, 'sc/buildings_tex.sc');

  const processorRegistry = new ProcessorRegistry();
  processorRegistry.register(new LzhamProcessor());
  processorRegistry.register(new ZstdProcessor());
  processorRegistry.register(new LzmaProcessor());
  processorRegistry.register(new SclzProcessor());
  processorRegistry.register(new ScProcessor());
  processorRegistry.register(new SigProcessor());

  const handlerRegistry = new HandlerRegistry();
  handlerRegistry.register(new ShapeHandler());
  handlerRegistry.register(new TextureHandler());
  handlerRegistry.register(new NoTextureHandler());
  handlerRegistry.register(new MovieClipsHandler());
  handlerRegistry.register(new MatrixHandler());
  handlerRegistry.register(new ResetMatrixHandler());
  handlerRegistry.register(new UncommonTextureHandler());

  // const scFiles = [new ScFile(file), new ScFile(texFile)];
  const scFiles = [new ScFile(file)];

  const decoder = new ScDecoder(processorRegistry, handlerRegistry);

  for (const scFile of scFiles) {
    await scFile.load();
    await decoder.decode(scFile);

    // // Texture
    // await scFile.load(texFile);
    // await decoder.decode(scFile);
  }

  console.log('SC File Parser completed successfully.');
})();
