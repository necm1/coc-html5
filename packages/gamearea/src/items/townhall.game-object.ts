import { AssetManager } from '@coc/asset-manager';
import { GameObject } from '../interface/game-object.abstract';

export class Townhall extends GameObject {
  constructor() {
    super();
  }

  public override async init(
    tileX: number,
    tileY: number,
    tileHeight: number,
    tileWidth: number
  ): Promise<void> {
    super.init(tileX, tileY, tileHeight, tileWidth);
    this.anchor.set(-0.1, 0.665);
  }

  public override async loadTextures(): Promise<void> {
    const texture = await AssetManager.get('buildings', '0');

    if (!texture) {
      throw new Error('Townhall texture not found');
    }

    this.texture = texture;
  }
}
