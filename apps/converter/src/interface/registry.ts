import { Handler } from './handler.interface';
import { Processor } from './processor.interface';

export abstract class Registry<T = Processor | Handler> {
  protected items: T[] = [];

  public abstract register(handler: T): void;
  public abstract getItem(item: unknown): Promise<T | undefined>;

  public getItems(): T[] {
    return this.items;
  }
}
