import { Application, ICanvas, RenderLayer, Sprite } from 'pixi.js';
import { Camera } from './camera.container';
import { AssetManager } from '@coc/asset-manager';

export class ClashCore {
  private static instance: ClashCore;

  public app: Application;
  public canvas: ICanvas;
  public layer = new RenderLayer();
  public camera: Camera;

  public static getInstance(): ClashCore {
    if (!ClashCore.instance) {
      ClashCore.instance = new ClashCore();
    }

    return ClashCore.instance;
  }

  public async init(): Promise<void> {
    console.log('ClashCore is initializing...');

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

    document.body.appendChild(this.app.canvas);
  }

  private async prepareAssets(): Promise<void> {
    await Promise.all([
      AssetManager.add('background_gamearea'),
      AssetManager.add('background_cc_gamearea'),
    ]);
  }

  public destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
