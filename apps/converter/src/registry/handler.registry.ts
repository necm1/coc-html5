import { HandlerEventEmitter } from '../handler.event-emitter';
import { Handler } from '../interface/handler.interface';
import { Registry } from '../interface/registry';

export class HandlerRegistry extends Registry<Handler> {
  private eventEmitter: HandlerEventEmitter;

  constructor() {
    super();
    this.eventEmitter = HandlerEventEmitter.getInstance();
  }

  public register(handler: any): void {
    this.getItems().push(handler);
  }

  public async getItem(tag: number): Promise<Handler | undefined> {
    for (const handlers of this.items) {
      if (await handlers.canHandle(tag, this.eventEmitter)) {
        return handlers;
      }
    }
    return undefined;
  }
}
