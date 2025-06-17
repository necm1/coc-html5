import { Entity } from '../interface/entity.interface';
import { ScFile } from '../sc-file';

type AssetConfigurationProps = {
  file: ScFile;
  id: number;
  name: string;
};

export class Asset extends Entity {
  private _file: ScFile;
  private _id: number;
  private _name: string;

  constructor({ file, id, name }: AssetConfigurationProps) {
    super();

    this._file = file;
    this._id = id;
    this._name = name;
  }

  public get file(): ScFile {
    return this._file;
  }

  public get id(): number {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }
}
