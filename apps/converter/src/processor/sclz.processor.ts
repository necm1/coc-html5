import { BufferReader } from '../buffer-reader';
import { Processor } from '../interface/processor.interface';

export class SclzProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    return data.buffer.subarray(0, 4).toString('utf8') === 'SCLZ';
  }

  public async process<T = void>(): Promise<T | void> {
    // Placeholder for SCLZ decompression logic
    console.log('SCLZ detected');
    return;
  }
}
