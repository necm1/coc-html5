import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { TilesContainer } from './tiles.container';
import { AssetManager } from '@coc/asset-manager';
import { Logger, toIso } from '@coc/utils';

export class GameArea extends Container {
  private readonly logger: Logger = new Logger(GameArea.name);

  public tilesContainer: TilesContainer;
  public gameBackgroundContainer = new Container();
  public gameAreaSprite: Sprite;
  private bottomLeftSprite: Sprite;
  private bottomRightSprite: Sprite;
  private topLeftSprite: Sprite;
  private topRightSprite: Sprite;
  private rightSprite: Sprite;
  private waterSprite: Sprite;
  public core: any;

  private textures: Record<string, Texture<any> | undefined> = {};

  constructor() {
    super();

    this.label = 'GameArea';
    this.sortableChildren = true;
    this.interactiveChildren = true;
    this.hitArea = null;
    this.cursor = 'default';
  }

  public async init() {
    const texturePromises: Record<string, Promise<Texture | undefined>> = {
      BACKGROUND: AssetManager.get('background_clan_capital', '110'),
      GAMEAREA: AssetManager.get('background_cc_gamearea', '0'),
      BOTTOM_LEFT: AssetManager.get('background_clan_capital', '63'),
      RIGHT_SPRITE: AssetManager.get('background_clan_capital', '64'),
      TOP_LEFT: AssetManager.get('background_clan_capital', '65'),
      TOP_RIGHT: AssetManager.get('background_clan_capital', '66'),
      BOTTOM_RIGHT: AssetManager.get('background_clan_capital', '67'),
      WATER_SPRITE: AssetManager.get('background_clan_capital', '111'),
    };

    const loadedTextures = await Promise.all(Object.values(texturePromises));

    const keys = Object.keys(texturePromises);
    this.textures = Object.fromEntries(
      keys.map((key, i) => [key, loadedTextures[i]])
    );

    await Promise.all([
      this.loadGameArea(),
      this.loadBottomLeftSprite(),
      this.loadTopLeftSprite(),
      this.loadTopRightSprite(),
      this.loadBottomRightSprite(),
      this.loadRightSprite(),
      this.loadWater(),
    ]);

    this.tilesContainer = new TilesContainer();

    const gridCenterIso = toIso({
      x: Math.floor(this.tilesContainer.gridWidth / 2),
      y: Math.floor(this.tilesContainer.gridHeight / 2),
    });

    // // Marker für Debug
    // const marker = new Graphics();
    // marker.beginFill(0xff0000);
    // marker.drawCircle(0, 0, 5);
    // marker.endFill();
    // marker.position.set(0, 0);
    // this.tilesContainer.addChild(marker);

    this.gameAreaSprite.zIndex = -1;
    this.gameAreaSprite.anchor.set(0.5, 0.5);
    this.gameAreaSprite.position.set(0, 0);

    this.gameBackgroundContainer.addChild(this.gameAreaSprite);

    this.gameBackgroundContainer.position.set(0, 0);
    this.tilesContainer.position.set(0, 0);

    this.gameAreaSprite.anchor.set(0.5, 0.5);
    this.gameAreaSprite.position.set(0, 0);

    this.tilesContainer.position.set(-gridCenterIso.x, -gridCenterIso.y);

    this.addChild(this.gameBackgroundContainer);
    this.addChild(this.tilesContainer);

    await this.tilesContainer.placeTownhall();
    await this.tilesContainer.placeArcher();

    this.emit('ready');

    this.logger.info('GameArea initialized');
  }

  private async loadWater() {
    const waterWidth = this.gameAreaSprite.width;
    const waterHeight = this.gameAreaSprite.height;

    const waterSprite = new Sprite(this.textures.WATER_SPRITE);
    waterSprite.anchor.set(0.95, 0.75);
    waterSprite.width = waterWidth;
    waterSprite.height = waterHeight * 1.5;
    waterSprite.sortableChildren = true;
    waterSprite.zIndex = -2;
    waterSprite.position.set(
      this.gameAreaSprite.width / 2,
      this.gameAreaSprite.height / 2
    );

    this.gameBackgroundContainer.addChildAt(waterSprite, 0);

    const waterSpriteRight = new Sprite(this.textures.WATER_SPRITE);
    waterSpriteRight.anchor.set(0.15, 0.45);
    waterSpriteRight.rotation = -Math.PI / 3;
    waterSpriteRight.width = waterWidth - 400;
    waterSpriteRight.height = waterHeight * 1.8;
    waterSpriteRight.sortableChildren = true;
    waterSpriteRight.zIndex = -3;
    waterSpriteRight.position.set(
      this.gameAreaSprite.width / 2,
      this.gameAreaSprite.height / 2
    );

    this.gameBackgroundContainer.addChildAt(waterSpriteRight, 1);

    const waterSpriteBottomRight = new Sprite(this.textures.WATER_SPRITE);
    waterSpriteBottomRight.anchor.set(0.45, 0.35);
    waterSpriteBottomRight.rotation = -Math.PI / 4.5;
    waterSpriteBottomRight.width = waterWidth - 350;
    waterSpriteBottomRight.height = waterHeight * 1.3;
    waterSpriteBottomRight.sortableChildren = true;
    waterSpriteBottomRight.zIndex = -4;
    waterSpriteBottomRight.position.set(
      this.gameAreaSprite.width / 2,
      this.gameAreaSprite.height / 2
    );

    this.gameBackgroundContainer.addChildAt(waterSpriteBottomRight, 2);

    const waterSpriteLeft = new Sprite(this.textures.WATER_SPRITE);
    waterSpriteLeft.anchor.set(0.95, 1.45);
    waterSpriteLeft.rotation = -Math.PI / 5.8;
    waterSpriteLeft.width = waterWidth;
    waterSpriteLeft.height = waterHeight;
    waterSpriteLeft.sortableChildren = true;
    waterSpriteLeft.zIndex = -2;
    waterSpriteLeft.position.set(
      this.gameAreaSprite.width / 2,
      this.gameAreaSprite.height / 2
    );

    this.gameBackgroundContainer.addChildAt(waterSpriteLeft, 3);

    const waterSpriteBottomLeft = new Sprite(this.textures.WATER_SPRITE);
    waterSpriteBottomLeft.anchor.set(0.8, 1.75);
    waterSpriteBottomLeft.rotation = -Math.PI / 3;
    waterSpriteBottomLeft.width = waterWidth;
    waterSpriteBottomLeft.height = waterHeight;
    waterSpriteBottomLeft.sortableChildren = true;
    waterSpriteBottomLeft.zIndex = -2;
    waterSpriteBottomLeft.position.set(
      this.gameAreaSprite.width / 2,
      this.gameAreaSprite.height / 2
    );

    this.gameBackgroundContainer.addChildAt(waterSpriteBottomLeft, 4);

    this.logger.info('Water sprites initialized');
  }

  private async loadGameArea() {
    if (!this.textures.GAMEAREA) {
      throw new Error('Game area texture not found');
    }

    this.gameAreaSprite = new Sprite(this.textures.GAMEAREA);
    this.gameAreaSprite.anchor.set(0.5, 0.5);
    this.gameAreaSprite.width = this.textures.GAMEAREA.width;
    this.gameAreaSprite.height = this.textures.GAMEAREA.height;
    this.gameAreaSprite.sortableChildren = true;
    this.gameAreaSprite.zIndex = -1;

    this.logger.info('Game area sprite loaded');
  }

  private async loadBottomLeftSprite() {
    if (!this.textures.BOTTOM_LEFT) {
      throw new Error('Bottom left texture not found');
    }

    this.bottomLeftSprite = new Sprite(this.textures.BOTTOM_LEFT);
    this.bottomLeftSprite.anchor.set(0, 1);

    const offsetX = -1640;
    const offsetY = 600;
    this.bottomLeftSprite.zIndex = 1;
    this.bottomLeftSprite.position.set(
      -this.gameAreaSprite.width / 2 + offsetX,
      this.gameAreaSprite.height / 2 + offsetY
    );
    this.gameAreaSprite.addChild(this.bottomLeftSprite);
  }

  private async loadTopLeftSprite() {
    if (!this.textures.TOP_LEFT) {
      throw new Error('Top left texture not found');
    }

    this.topLeftSprite = new Sprite(this.textures.TOP_LEFT);
    this.topLeftSprite.sortableChildren = true;
    this.topLeftSprite.zIndex = -2;
    this.topLeftSprite.anchor.set(0, 1);

    const offsetX = -1340;
    const offsetY = -890;

    this.topLeftSprite.zIndex = -2;
    this.topLeftSprite.position.set(
      -this.gameAreaSprite.width / 2 + offsetX,
      this.gameAreaSprite.height / 2 + offsetY
    );

    this.gameAreaSprite.addChild(this.topLeftSprite);
  }

  private async loadTopRightSprite() {
    if (!this.textures.TOP_RIGHT) {
      throw new Error('Top right texture not found');
    }

    this.topRightSprite = new Sprite(this.textures.TOP_RIGHT);
    this.topRightSprite.anchor.set(0, 1);

    const offsetX = 1500;
    const offsetY = -1009;
    this.topRightSprite.zIndex = 1;
    this.topRightSprite.position.set(
      -this.gameAreaSprite.width / 2 + offsetX,
      this.gameAreaSprite.height / 2 + offsetY
    );
    this.gameAreaSprite.addChild(this.topRightSprite);
  }

  private async loadBottomRightSprite() {
    if (!this.textures.BOTTOM_RIGHT) {
      throw new Error('Bottom right texture not found');
    }

    this.bottomRightSprite = new Sprite(this.textures.BOTTOM_RIGHT);
    this.bottomRightSprite.anchor.set(0, 1);

    const offsetX = 1500;
    const offsetY = 600;
    this.bottomRightSprite.zIndex = 1;
    this.bottomRightSprite.position.set(
      -this.gameAreaSprite.width / 2 + offsetX,
      this.gameAreaSprite.height / 2 + offsetY
    );
    this.gameAreaSprite.addChild(this.bottomRightSprite);
  }

  private async loadRightSprite() {
    if (!this.textures.RIGHT_SPRITE) {
      throw new Error('Right sprite texture not found');
    }

    this.rightSprite = new Sprite(this.textures.RIGHT_SPRITE);
    this.rightSprite.anchor.set(0, 1);

    const offsetX = 1502;
    const offsetY = 630;
    this.rightSprite.zIndex = 1;
    this.rightSprite.position.set(
      -this.gameAreaSprite.width / 2 + offsetX,
      this.gameAreaSprite.height / 2 + offsetY
    );
    this.gameAreaSprite.addChild(this.rightSprite);
  }
}
