import { Container, Sprite } from 'pixi.js';
import { TilesContainer } from './tiles.container';
import { AssetManager } from '@coc/asset-manager';

export class GameArea extends Container {
  private tilesContainer: TilesContainer;
  private backgroundSprite: Sprite;

  constructor(public readonly core: any) {
    super();

    this.label = 'GameArea';
    this.sortableChildren = true;
    this.interactiveChildren = true;
    this.hitArea = null;
    this.cursor = 'default';

    this.x = 0;
    this.y = 0;

    this.tilesContainer = new TilesContainer();

    this.init();
    this.addChild(this.tilesContainer);
  }

  public async init() {
    await AssetManager.add('background_gamearea');
    const texture = await AssetManager.getShapeTexture(
      'background_cc_gamearea',
      '0'
    );

    if (!texture) {
      throw new Error('Background sprite not found');
    }

    this.backgroundSprite = new Sprite(texture);

    this.backgroundSprite.anchor.set(0);
    this.backgroundSprite.position.set(0, 0);
    this.backgroundSprite.zIndex = -1;

    const isoWidth =
      (this.tilesContainer.gridWidth + this.tilesContainer.gridHeight) *
      (this.tilesContainer.tileSize / 2);
    const isoHeight =
      (this.tilesContainer.gridWidth + this.tilesContainer.gridHeight) *
      (this.tilesContainer.tileSize / 2) *
      this.tilesContainer.skewFactor;

    this.backgroundSprite.anchor.set(0.5);
    this.backgroundSprite.position.set(0, 0);
    this.backgroundSprite.width = isoWidth;
    this.backgroundSprite.height = isoHeight;

    this.addChild(this.backgroundSprite);
  }
}
