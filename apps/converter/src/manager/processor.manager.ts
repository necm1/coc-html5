import { Registry } from '../interface/registry';
import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';

export class ProcessorManager extends Registry<Processor> {
  public register(processor: any): void {
    this.items.push(processor);
  }

  public async getItem(item: BufferReader): Promise<Processor | undefined> {
    for (const processor of this.items) {
      if (await processor.canProcess(item)) {
        return processor;
      }
    }
    return undefined;
  }
}
