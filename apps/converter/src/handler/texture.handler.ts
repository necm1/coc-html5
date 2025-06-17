import { Handler, HandlerProps } from '../interface/handler.interface';
import { Texture } from '../entity/texture.entity';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { join, basename, dirname } from 'path';
import { execFile } from 'child_process';
import sharp from 'sharp';
import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';

export class TextureHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return [1, 16, 28, 29, 34, 19, 24, 27, 45, 47].includes(tag);
  }

  public override async handle({
    file,
    tag,
    textureId,
  }: HandlerProps): Promise<void> {
    if (typeof textureId !== 'number') {
      return;
    }

    // if (file.isTextureFile && textureId && textureId >= file.textures.length) {
    //   file.textures.push(new Texture());
    // }

    // const texture = file.textures[textureId];
    // await texture.load(file, tag);
    let texture: Texture;
    if (file.textures[textureId]) {
      texture = file.textures[textureId];
      await texture.load(file, tag);
    } else {
      texture = new Texture();
      await texture.load(file, tag);
      file.textures[textureId] = texture;
    }

    // const texture = new Texture();
    // await texture.load(file, tag);
    // file.textures.push(texture);

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.ADD_TEXTURE,
      args: [],
    });

    // if (khronosTextureData != null) {
    //   console.log(
    //     `Decoding KTX texture data of length ${khronosTextureLength} for textureId ${textureId}`
    //   );
    //   const imageBuffer = await this.decodeKTX(khronosTextureData);
    //   console.log(`Decoded KTX texture data for textureId ${textureId}`);
    //   const texFilename = basename(file.filePath, '_tex.sc');
    //   const fileName = khronosTextureFileName || `${texFilename}_${textureId}`;

    //   const outputPath = join(
    //     __dirname,
    //     '../../../../../src/assets',
    //     `out/${texFilename}/textures/${fileName}.png`
    //   );

    //   const dir = dirname(outputPath);

    //   await fs.mkdir(dir, { recursive: true });

    //   await sharp(imageBuffer)
    //     // .png({ compressionLevel: 1, effort: 1 })
    //     .toFile(outputPath)
    //     .catch((err) => {
    //       console.error(`Error saving texture ${fileName}:`, err);
    //     });

    //   console.log(`Texture ${fileName} saved to ${outputPath}`);

    //   return;
    // }
  }

  private async decodeKTX(khronosTextureData: Buffer): Promise<Buffer> {
    const tmpKtxPath = join(tmpdir(), `texture_${Date.now()}.ktx`);
    const tmpPngPath = tmpKtxPath.replace(/\.ktx$/, '.png');
    await fs.writeFile(tmpKtxPath, khronosTextureData);

    const cliPath = '/Users/necmi/Downloads/XCoder/xcoder/bin/PVRTexToolCLI';
    const args = ['-i', tmpKtxPath, '-d', tmpPngPath, '-ics', 'sRGB', '-noout'];

    await new Promise<void>((resolve, reject) => {
      execFile(cliPath, args, (error, stdout, stderr) => {
        if (error) {
          console.error('PVRTexToolCLI error:', stderr);
          reject(error);
        } else {
          resolve();
        }
      });
    });

    const pngBuffer = await fs.readFile(tmpPngPath);

    await fs.unlink(tmpKtxPath);
    await fs.unlink(tmpPngPath);

    return pngBuffer;
  }
}
