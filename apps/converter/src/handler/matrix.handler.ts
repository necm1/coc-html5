import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';
import { Handler, HandlerProps } from '../interface/handler.interface';

export class MatrixHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return [8, 36].includes(tag);
  }

  public override async handle({
    file,
    tag,
    length,
    matricesLoaded,
  }: HandlerProps): Promise<void> {
    if (typeof matricesLoaded !== 'number') {
      throw new Error('Matrices loaded index is not defined');
    }

    await file.matrix.getMatrix(matricesLoaded).load(file, tag);

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.MATRIX_LOADED,
      args: [],
    });
  }
}
