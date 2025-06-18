import { Registry } from '../interface/registry';
import { Processor } from '../interface/processor.interface';
import { BufferReader } from '../buffer-reader';
import { NoProcessorException } from '../exception/no-processor.exception';

export class ProcessorRegistry extends Registry<Processor> {
  public register(processor: Processor): void {
    if (!(processor instanceof Processor)) {
      throw new Error('Processor must be an instance of Processor interface');
    }

    if (this.items.some((item) => item.constructor === processor.constructor)) {
      throw new Error(
        `Processor ${processor.constructor.name} is already registered`
      );
    }

    if (
      typeof processor.canProcess !== 'function' ||
      typeof processor.process !== 'function'
    ) {
      throw new Error(
        'Processor must implement canProcess and process methods'
      );
    }

    this.items.push(processor);
  }

  public async getItem(item: BufferReader): Promise<Processor | undefined> {
    return new Promise<Processor | undefined>((resolve) => {
      for (const processor of this.items) {
        if (processor.canProcess(item)) {
          resolve(processor);
          return;
        }
      }

      throw new NoProcessorException();
    });
  }
}
