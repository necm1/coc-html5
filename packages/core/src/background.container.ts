import { AssetManager } from '@coc/asset-manager';
import { Container, Sprite } from 'pixi.js';

export class BackgroundContainer extends Container {
  private backgroundSprite: Sprite;
  constructor() {
    super();

    this.label = 'BackgroundContainer';
    this.sortableChildren = true;
    this.interactiveChildren = false;
    this.cursor = 'default';
    this.x = 0;
    this.y = 0;
    this.eventMode = 'static';
    this.interactive = false;

    this.zIndex = -1;
  }

  public async init() {
    const texturePromises = {
      BACKGROUND: AssetManager.get('background_clan_capital', '110'),
    };

    const loadedTextures = await Promise.all(Object.values(texturePromises));

    const keys = Object.keys(texturePromises);
    const textures = Object.fromEntries(
      keys.map((key, i) => [key, loadedTextures[i]])
    );

    this.backgroundSprite = new Sprite(textures.BACKGROUND);
    this.backgroundSprite.anchor.set(0.5, 0.5);
    // this.backgroundSprite.scale.set(1.5);
    // this.backgroundSprite.position.set(this.width / 2, this.height / 2);
    this.addChild(this.backgroundSprite);

    this.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  public resize(width: number, height: number) {
    // Passe die Größe so an, dass das Bild immer mindestens den Bildschirm ausfüllt
    const scaleX = width / this.backgroundSprite.texture.width;
    const scaleY = height / this.backgroundSprite.texture.height;
    const scale = Math.max(scaleX, scaleY);

    this.backgroundSprite.scale.set(scale);
    this.backgroundSprite.position.set(width / 2, height / 2);
  }
}
