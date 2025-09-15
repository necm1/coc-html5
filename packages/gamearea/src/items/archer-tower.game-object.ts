import { AssetManager } from '@coc/asset-manager';
import { GameObject } from '../interface/game-object.abstract';

export class ArcherTower extends GameObject {
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

    this.anchor.set(-0.37, 0.75);
  }

  public override async loadTextures() {
    const texture = await AssetManager.get('buildings', '6901');

    if (!texture) {
      throw new Error('Archer Tower texture not found');
    }

    this.texture = texture;
  }
}
