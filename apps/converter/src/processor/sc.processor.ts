import { BufferReader } from '../buffer-reader';
import { Processor } from '../interface/processor.interface';
import { ScFile } from '../sc-file';

export class ScProcessor extends Processor {
  public canProcess(data: BufferReader): boolean {
    return data.buffer.subarray(0, 2).toString('utf-8') === 'SC';
  }

  public async process(scFile: ScFile): Promise<void> {
    const bufferReader = scFile.bufferReader;

    bufferReader.readBytes(2).toString('utf-8');

    scFile.version = bufferReader.readInt32BE();

    if (scFile.version === 4) {
      scFile.version = bufferReader.readInt32BE();
    }

    if (scFile.version === 0x05) {
      const metadataTableOffset = bufferReader.readInt32LE();
      bufferReader.readBytes(metadataTableOffset);
    } else {
      const hashLength = bufferReader.readInt32BE();
      scFile.fileHash = bufferReader.readBytes(hashLength).toString('hex');
    }

    scFile.bufferReader = new BufferReader(
      bufferReader.buffer.subarray(bufferReader.offset)
    );
  }
}
