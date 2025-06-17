import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';
import { ScFile } from '../sc-file';

export class LzmaProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    const buffer = data.buffer.subarray(0, 4);
    return buffer[1] === 0x00 && buffer[3] === 0x00;
  }
  public async process(scFile: ScFile): Promise<void> {
    // Placeholder for LZMA decompression logic
    console.log('LZMA detected');
  }
}
