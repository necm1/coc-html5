import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';
import { decompress } from '@mongodb-js/zstd';
import { ScFile } from '../sc-file';

export class ZstdProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    const buffer = data.buffer;
    return buffer.subarray(0, 4).equals(Buffer.from([0x28, 0xb5, 0x2f, 0xfd]));
  }

  public async process(scFile: ScFile): Promise<void> {
    if (!scFile.bufferReader?.buffer) {
      throw new Error(
        'BufferReader buffer is empty. Please ensure the file is loaded correctly.'
      );
    }

    const decompressedData = await decompress(scFile.bufferReader.buffer);

    if (!decompressedData) {
      throw new Error('Failed to decompress ZSTD data.');
    }

    scFile.bufferReader = new BufferReader(Buffer.from(decompressedData));
  }
}
