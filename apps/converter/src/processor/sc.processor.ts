import { BufferReader } from '../buffer-reader';
import { Processor } from '../interface/processor.interface';
import { ScFile } from '../sc-file';

export class ScProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    return data.buffer.subarray(0, 2).toString('utf-8') === 'SC';
  }

  public async process(scFile: ScFile): Promise<void> {
    const bufferReader = scFile.bufferReader;

    // Skip the first 2 bytes ('SC')
    bufferReader.readBytes(2).toString('utf-8');

    const fileVersion = bufferReader.readUInt32BE();

    if (fileVersion !== 4) {
      scFile.version = fileVersion;

      const hashLength = bufferReader.readUInt32BE();
      bufferReader.buffer = bufferReader.buffer.subarray(10 + hashLength);
      // bufferReader.readBytes(hashLength);
      console.log(
        `SC file version: ${scFile.version}, hash length: ${hashLength}`
      );
      return;
    }

    scFile.version = bufferReader.readUInt32BE();
    // scFile.version = bufferReader.readUInt32BE();

    const hashLength = bufferReader.readUInt32BE();

    const endBlockSize = bufferReader.buffer.readUInt32BE(
      bufferReader.length - 4
    );

    console.log(
      `SC file version: ${scFile.version}, hash length: ${hashLength}, end offset: ${endBlockSize}`
    );

    bufferReader.buffer = bufferReader.buffer.subarray(
      14 + hashLength,
      bufferReader.length - endBlockSize - 9
    );
  }
}
