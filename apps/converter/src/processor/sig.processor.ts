import { BufferReader } from '../buffer-reader';
import { Processor } from '../interface/processor.interface';

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

  public async process(): Promise<void> {
    // Placeholder for SIG processing logic
    console.log('SIG processing logic not implemented yet.');
  }
}
