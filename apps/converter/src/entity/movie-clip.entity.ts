import { BufferReader } from '../buffer-reader';
import { Entity } from '../interface/entity.interface';
import { MovieClipFrame } from './movie-clip-frame.entity';

export class MovieClip extends Entity {
  public id = -1;
  public exportName: string | null = null;
  public fps = 30;

  public frameCount = 0;
  public frames: MovieClipFrame[] = [];
  public frameElements: [number, number, number][] = [];

  public blends: number[] = [];
  public binds: number[] = [];
  public matrixIndex = 0;

  public override async load(reader: BufferReader, tag: number): Promise<void> {
    this.id = reader.readUInt16LE();
    this.fps = reader.readByte(reader.offset, false);
    this.frameCount = reader.readUInt16LE();

    if (![3, 14].includes(tag)) {
      if (tag === 49) {
        reader.readByte(reader.offset, false);
      }

      const transformsCount = reader.readUInt32LE();

      for (let i = 0; i < transformsCount; i++) {
        const childIndex = reader.readUInt16LE();
        const matrixIndex = reader.readUInt16LE();
        const colorTransformIndex = reader.readUInt16LE();

        this.frameElements.push([childIndex, matrixIndex, colorTransformIndex]);
      }
    }

    const bindsCount = reader.readUInt16LE();

    for (let i = 0; i < bindsCount; i++) {
      const bindId = reader.readUInt16LE();
      this.binds.push(bindId);
    }

    if ([12, 35, 49].includes(tag)) {
      for (let i = 0; i < bindsCount; i++) {
        const blend = reader.readByte(reader.offset, false);
        this.blends.push(blend);
      }
    }

    for (let i = 0; i < bindsCount; i++) {
      reader.readString();
    }

    let elementsUsed = 0;

    while (true) {
      const frameTag = reader.readByte();
      const frameLength = reader.readInt32LE();

      if (frameTag === 0) {
        break;
      }

      if (frameTag === 11) {
        const frame = new MovieClipFrame();
        await frame.load(reader);
        frame.elements = this.frameElements.slice(
          elementsUsed,
          elementsUsed + frame.elementsCount
        );
        this.frames.push(frame);
        elementsUsed += frame.elementsCount;
      } else if (frameTag === 41) {
        this.matrixIndex = reader.readByte();
      } else {
        reader.readBytes(frameLength);
      }
    }
  }
}
