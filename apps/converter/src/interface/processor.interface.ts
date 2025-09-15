import { BufferReader } from '../buffer-reader';
import { ScFile } from '../sc-file';

export abstract class Processor {
  public abstract canProcess(data: BufferReader): boolean;
  public abstract process(scFile: ScFile): Promise<any>;
}
