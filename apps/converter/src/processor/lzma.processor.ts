import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';
import { ScFile } from '../sc-file';
import { decompress } from 'lzma-native';
// const LZMA = require('lzma');
// const lzma = LZMA.decompress(byte_array, on_finish(result, error) {}, on_progress(percent) {});
// const lzmajs = require('lzma-purejs');

export class LzmaProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    const buffer = data.buffer.subarray(0, 4);
    return buffer[1] === 0x00 && buffer[3] === 0x00;
  }
  public async process(scFile: ScFile): Promise<void> {
    // Placeholder for LZMA decompression logic
    console.log('LZMA detected');

    const buffer = scFile.bufferReader.buffer;

    const uncompressedSize = buffer.readInt32LE(5);

    const compressed = Buffer.concat([
      buffer.subarray(0, 5),
      Buffer.allocUnsafe(8).fill(uncompressedSize === -1 ? 0xff : 0),
      buffer.subarray(13),
    ]);

    // const compressed = Buffer.concat([
    //   buffer.subarray(0, 5),
    //   Buffer.alloc(8, 0xff),
    //   buffer.subarray(13),
    // ]);

    // const compressed = Buffer.concat([
    //   buffer.subarray(0, 9),
    //   Buffer.alloc(4, 0xff),
    //   buffer.subarray(9),
    // ]);

    console.log(
      `Buffer length : ${buffer.length} bytes, buffer: ${buffer.toString(
        'hex'
      )}`
    );
    console.log(
      `Compressed data length: ${
        compressed.length
      } bytes, buffer: ${compressed.toString('hex')}`
    );

    const decompressed: Buffer = await new Promise((resolve, reject) => {
      // resolve(lzmajs.decompressFile(compressed));
      decompress(compressed, {}, (result) => {
        console.log('result ', result);
        if (!result) {
          reject(new Error('Decompression failed'));
          return;
        }
        resolve(result);
      });

      // LZMA().decompress(
      //   buffer,
      //   (result: Buffer) => {
      //     if (!result) {
      //       reject(new Error('Decompression failed'));
      //     } else {
      //       resolve(result);
      //     }
      //   },
      //   (progress: number) =>
      //     console.log(`Decompression progress: ${progress * 100}%`)
      // );
      // LZMA.decompress(
      //   compressed,
      //   (result: Buffer, error: Error) => {
      //     if (error) {
      //       reject(error);
      //     } else {
      //       resolve(result);
      //     }
      //   },
      //   (progress: number) =>
      //     console.log(`Decompression progress: ${progress * 100}%`)
      // );
    });

    console.log(decompressed.length, 'bytes decompressed from LZMA');
    //
    scFile.bufferReader = new BufferReader(Buffer.from(decompressed));
  }

  // private async decompress(buffer: Buffer): Promise<Buffer> {
  //   return new Promise<Buffer>((resolve, reject) => {
  //     decompress(
  //       buffer,
  //       {
  //         threads: 4,
  //         blockSize: 32 * 1024,
  //       },
  //       (result) => {
  //         resolve(result);
  //       }
  //     );
  //   });
  // }
}
