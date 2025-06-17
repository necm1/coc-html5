import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';
import { decompress } from '@mongodb-js/zstd';
import { ScFile } from '../sc-file';

export class ZstdProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    const bytes = data.buffer.subarray(0, 4);

    if (
      bytes[0] !== 0x28 &&
      bytes[1] !== 0xb5 &&
      bytes[2] !== 0x2f &&
      bytes[3] !== 0xfd
    ) {
      return false;
    }

    return true;
  }

  public async process(scFile: ScFile): Promise<void> {
    console.log('ZSTD detected');
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
