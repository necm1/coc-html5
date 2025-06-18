import { Entity } from '../interface/entity.interface';
import { ScFile } from '../sc-file';
import { Region } from './region.entity';

export class Shape extends Entity {
  public readonly regions: Region[] = [];
  public id = 0;

  public override async load(file: ScFile, tag: number): Promise<void> {
    const reader = file.bufferReader;
    this.id = reader.readUInt16LE();

    reader.readUInt16LE();

    if (tag == 18) {
      const pointCount = reader.readUInt16LE();
    }

    while (true) {
      const regionTag = reader.readByte(reader.offset, false);
      const regionLength = reader.readUInt32LE();

      if (regionTag == 0) {
        return;
      }

      if ([4, 17, 22].includes(regionTag)) {
        const region = new Region();
        await region.load(file, tag);
        this.regions.push(region);
      } else {
        reader.readBytes(regionLength);
      }
    }
  }
}
