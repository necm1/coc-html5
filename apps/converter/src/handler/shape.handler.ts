import { Region } from '../entity/region.entity';
import { Shape } from '../entity/shape.entity';
import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';
import { Handler, HandlerProps } from '../interface/handler.interface';
import { Vector2D } from '../interface/vector2d.interface';

export class ShapeHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return [2, 18].includes(tag);
  }

  public override async handle({ file, tag }: HandlerProps): Promise<void> {
    // const reader = file.bufferReader;
    // const id = reader.readUInt16LE();
    const shape = new Shape();
    await shape.load(file, tag);
    file.shapes.push(shape);

    // reader.readUInt16LE();

    // if (tag == 18) {
    //   const pointCount = reader.readUInt16LE();
    // }

    // while (true) {
    //   const regionTag = reader.readByte();
    //   const regionLength = reader.readUInt32LE();

    //   if (regionTag == 0) {
    //     break;
    //   }

    //   if ([4, 17, 22].includes(regionTag)) {
    //     const region = new Region();
    //     await region.load(file, tag);
    //     shapeEntity.regions.push(region);
    //     file.shapes.push(shapeEntity);
    //   } else {
    //     reader.readBytes(regionLength);
    //   }
    // }

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.SHAPE_LOADED,
      args: [],
    });
  }
}
