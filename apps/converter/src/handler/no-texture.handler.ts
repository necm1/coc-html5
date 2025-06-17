import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';
import { Handler, HandlerProps } from '../interface/handler.interface';

export class NoTextureHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return tag === 26;
  }

  public override async handle({ file }: HandlerProps): Promise<void> {
    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.NO_TEXTURE,
      args: [],
    });
  }
}
