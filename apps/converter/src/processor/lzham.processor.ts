import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';
import { ScFile } from '../sc-file';

export class LzhamProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    return data.buffer.subarray(0, 4).toString('utf8') === 'SCLZ';
  }
  public async process<T = void>(scFile: ScFile): Promise<T | void> {
    if (!scFile.bufferReader?.buffer) {
      throw new Error(
        'BufferReader buffer is empty. Please ensure the file is loaded correctly.'
      );
    }

    console.log('LZHAM detected');

    const dictSizeLog2 = scFile.bufferReader.readByte();
    const outputSize = scFile.bufferReader.readUInt32LE();

    // scFile.bufferReader = new BufferReader(Buffer.from(lzham.decompress()));
    return;
  }
}
