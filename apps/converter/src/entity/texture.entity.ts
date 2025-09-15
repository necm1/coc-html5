import { Canvas, createCanvas, Image } from 'canvas';
import { Entity } from '../interface/entity.interface';
import { ScFile } from '../sc-file';
import { join } from 'path';
import { tmpdir } from 'os';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { BufferReader } from '../buffer-reader';
import { getByteCountByPixelType, getFormatByPixelType } from '../utils/pixel';

const CHUNK_SIZE = 32;

export class Texture extends Entity {
  public image: Canvas | null = null;
  public imageBuffer: Buffer | null = null;

  public pixelType = -1;
  public width = 0;
  public height = 0;

  constructor() {
    super();
  }

  public override async load(file: ScFile, tag: number): Promise<void> {
    const reader = file.bufferReader;

    let khronosTextureLength = 0;
    let khronosTextureFileName: string | undefined = undefined;

    if (tag === 45) {
      khronosTextureLength = reader.readInt32LE();
    } else if (tag == 47) {
      khronosTextureFileName = reader.readString();
    }

    this.pixelType = reader.readByte(reader.offset, false);
    this.width = reader.readUInt16LE();
    this.height = reader.readUInt16LE();

    if (!file.hasTexture) {
      return;
    }

    let khronosTextureData = null;

    if (tag === 45) {
      khronosTextureData = reader.readBytes(khronosTextureLength);
    }

    if (khronosTextureData !== null) {
      // console.log(khronosTextureData.length, 'bytes of KTX texture data found');
      this.imageBuffer = await this.decodeKTX(khronosTextureData);
      this.image = await this.loadImageFromBuffer();
      return;
    }

    this.image = await this.loadTexture(reader, tag);
    return;
  }

  private async loadTexture(
    reader: BufferReader,
    tag: number
  ): Promise<Canvas | null> {
    if ([27, 28, 29].includes(tag)) {
      return this.joinImage(reader);
    }

    return this.loadImageFromBuffer();
  }

  private joinImage(pixelBuffer: BufferReader): Canvas {
    const mode = getFormatByPixelType(this.pixelType);
    const bytesPerPixel = getByteCountByPixelType(this.pixelType);

    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(this.width, this.height);

    const chunkCountX = Math.ceil(this.width / CHUNK_SIZE);
    const chunkCountY = Math.ceil(this.height / CHUNK_SIZE);
    const chunkCount = chunkCountX * chunkCountY;

    // rawMode wird in node-canvas nicht direkt benötigt, aber ggf. für spätere Erweiterungen
    // const rawMode = getRawMode(pixelType);

    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const chunkX = (chunkIndex % chunkCountX) * CHUNK_SIZE;
      const chunkY = Math.floor(chunkIndex / chunkCountX) * CHUNK_SIZE;

      const chunkWidth = Math.min(this.width - chunkX, CHUNK_SIZE);
      const chunkHeight = Math.min(this.height - chunkY, CHUNK_SIZE);

      // Lies die Bytes für diesen Chunk
      const chunkByteLength = bytesPerPixel * chunkWidth * chunkHeight;
      const chunkBuffer = pixelBuffer.readBytes(chunkByteLength);

      // Schreibe die Pixel in das ImageData-Array
      for (let y = 0; y < chunkHeight; y++) {
        for (let x = 0; x < chunkWidth; x++) {
          const pixelIndex = (y * chunkWidth + x) * bytesPerPixel;
          const globalX = chunkX + x;
          const globalY = chunkY + y;
          const globalIndex = (globalY * this.width + globalX) * 4; // 4 für RGBA

          // Annahme: chunkBuffer ist RGBA, ggf. anpassen für andere Formate!
          imageData.data[globalIndex] = chunkBuffer[pixelIndex]; // R
          imageData.data[globalIndex + 1] = chunkBuffer[pixelIndex + 1]; // G
          imageData.data[globalIndex + 2] = chunkBuffer[pixelIndex + 2]; // B
          imageData.data[globalIndex + 3] =
            bytesPerPixel === 4 ? chunkBuffer[pixelIndex + 3] : 255; // A
        }
      }

      // Optional: Fortschrittsanzeige
      // console.log(`joinImage: chunk ${chunkIndex + 1} / ${chunkCount}`);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  private async loadImageFromBuffer(): Promise<Canvas | null> {
    if (!this.imageBuffer) return null;

    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = this.imageBuffer as Buffer;
    });
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
