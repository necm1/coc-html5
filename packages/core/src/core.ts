import { Application, ICanvas, RenderLayer, Sprite } from 'pixi.js';
import { Camera } from './camera.container';
import { AssetManager } from '@coc/asset-manager';
import { BackgroundContainer } from './background.container';
import { ClashWorld } from './world.container';
import { Logger } from '@coc/utils';

export class ClashCore {
  private readonly logger: Logger = new Logger(ClashCore.name);
  private static instance: ClashCore;

  public app: Application;
  public canvas: ICanvas;
  public layer = new RenderLayer();
  public camera: Camera;
  public world: ClashWorld;
  public background: BackgroundContainer = new BackgroundContainer();

  public static getInstance(): ClashCore {
    if (!ClashCore.instance) {
      ClashCore.instance = new ClashCore();
    }

    return ClashCore.instance;
  }

  public async init(): Promise<void> {
    this.logger.info('ClashCore is initializing...');

    this.app = new Application();

    await this.app.init({
      backgroundColor: 0x000000,
      height: window.innerHeight,
      width: window.innerWidth,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
      eventMode: 'passive',
    });

    this.canvas = this.app.canvas;

    await this.prepareAssets();
    this.app.stage.addChild(this.layer);

    this.camera = new Camera();
    this.world = new ClashWorld();

    await this.world.init();

    this.camera.addChild(this.world);
    this.app.stage.addChild(this.camera);

    this.camera.registerEvents();
    this.camera.centerOnWorldCenter();

    document.body.appendChild(this.app.canvas);
  }

  private async prepareAssets(): Promise<void> {
    await Promise.all([
      AssetManager.add('background_cc_gamearea'),
      AssetManager.add('buildings'),
      AssetManager.add('background_clan_capital'),
    ]);
  }

  public destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
