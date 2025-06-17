import { Application, ICanvas, RenderLayer } from 'pixi.js';

export class ClashCore {
  private static instance: ClashCore;

  public app: Application;
  public canvas: ICanvas;
  public layer = new RenderLayer();

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
    this.app.stage.addChild(this.layer);

    document.body.appendChild(this.app.canvas);
  }

  public destroy(): void {
    this.app.destroy(true, { children: true });
    // window.removeEventListener('resize');
  }
}
