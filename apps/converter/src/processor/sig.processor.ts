import { BufferReader } from '../buffer-reader';
import { Processor } from '../interface/processor.interface';
import { ScFile } from '../sc-file';

export class SigProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    const buffer = data.buffer.subarray(0, 4);

    return (
      buffer.length >= 4 &&
      buffer[0] === 0x53 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x47 &&
      buffer[3] === 0x00
    );
  }

  public async process(scFile: ScFile): Promise<void> {
    scFile.bufferReader = new BufferReader(
      scFile.bufferReader.buffer.subarray(68)
    );
  }
}
