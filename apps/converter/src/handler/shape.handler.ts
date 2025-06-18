import { Shape } from '../entity/shape.entity';
import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';
import { Handler, HandlerProps } from '../interface/handler.interface';

export class ShapeHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return [2, 18].includes(tag);
  }

  public override async handle({
    file,
    tag,
    shapesLoaded,
  }: HandlerProps): Promise<void> {
    const shape = new Shape();
    await shape.load(file, tag);
    file.shapes[shapesLoaded as number] = shape;

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.SHAPE_LOADED,
      args: [],
    });
  }
}
