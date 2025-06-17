import { BufferReader } from '../buffer-reader';
import { Entity } from '../interface/entity.interface';

export class MovieClipFrame extends Entity {
  private _elementsCount = 0;
  private _label: string | null = null;
  public elements: [number, number, number][] = [];

  public override async load(reader: BufferReader): Promise<void> {
    this._elementsCount = reader.readInt16LE();
    this._label = reader.readString();
  }

  public getElement(index: number): [number, number, number] | null {
    return this.elements[index];
  }

  public get elementsCount(): number {
    return this._elementsCount;
  }

  public get label(): string | null {
    return this._label;
  }
}
