import { Matrix } from '../entity/matrix.entity';
import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';
import { Handler, HandlerProps } from '../interface/handler.interface';

export class ResetMatrixHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return tag === 42;
  }

  public override async handle({ file }: HandlerProps): Promise<void> {
    const reader = file.bufferReader;
    const matrixCount = reader.readUInt16LE();
    const colorTransformationCount = reader.readUInt16LE();

    file.matrix = new Matrix();
    await file.matrix.load(matrixCount, colorTransformationCount);
    file.matrices.push(file.matrix);

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.RESET_MATRIX,
      args: [],
    });
  }
}
