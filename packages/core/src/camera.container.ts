import { Container, ContainerChild } from 'pixi.js';
import { ClashCore } from './core';
import { Logger } from '@coc/utils';

export class Camera extends Container {
  private readonly logger = new Logger(Camera.name);
  private dragging = false;
  private lastPos = { x: 0, y: 0 };
  private baseScale = 1.5;
  private minScale = 1;
  private mapHeight = 0;

  private core: ClashCore = ClashCore.getInstance();

  constructor() {
    super();

    this.sortableChildren = true;
    this.interactiveChildren = true;

    this.hitArea = null;
    this.cursor = 'default';

    this.x = 0;
    this.y = 0;
  }

  public registerEvents(): void {
    const canvas = this.core.canvas as unknown as HTMLCanvasElement;

    const world = this.world;
    const gameArea = world.children[0] as any;

    const allYs = [gameArea.topLeftSprite.y, gameArea.bottomLeftSprite.y];
    const topMost = Math.min(...allYs);
    const bottomMost = Math.max(...allYs);
    const screenH = this.core.app.screen.height;
    this.mapHeight = bottomMost - topMost;
    this.minScale = screenH / this.mapHeight;

    if (!canvas) {
      return;
    }

    canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.lastPos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mouseup', () => (this.dragging = false));

    canvas.addEventListener('mousemove', (e) => {
      // if (this.dragging) {
      //   const gameArea = this.world.children[0];
      //   const dx = e.clientX - this.lastPos.x;
      //   const dy = e.clientY - this.lastPos.y;
      //   gameArea.x += dx;
      //   gameArea.y += dy;
      //   this.lastPos = { x: e.clientX, y: e.clientY };
      //   this.clampCameraPosition();
      // }

      if (this.dragging) {
        const world = this.world;
        const dx = e.clientX - this.lastPos.x;
        const dy = e.clientY - this.lastPos.y;
        world.x += dx;
        world.y += dy;
        this.lastPos = { x: e.clientX, y: e.clientY };
        this.clampCameraPosition();
      }
    });

    canvas.addEventListener('wheel', (e) => {
      // const maxScale = 4.5; // oder was du willst
      // let newScale = this.scale.x * (e.deltaY < 0 ? 1.1 : 0.9);
      // newScale = Math.max(this.minScale, Math.min(maxScale, newScale));
      // this.scale.set(newScale);
      // this.clampCameraPosition();

      const world = this.world;
      const gameArea = world.children[0] as any;

      // Map-Grenzen für Y (ohne height-Fehler!)
      const allYs = [gameArea.topLeftSprite.y, gameArea.bottomLeftSprite.y];
      const topMost = Math.min(...allYs);
      const bottomMost = Math.max(...allYs);
      const screenH = this.core.app.screen.height;
      const mapHeight = bottomMost - topMost;

      // Puffer in Pixeln (z.B. 80px oben und unten)
      const padding = 0.5;
      // minScale so, dass Map-Höhe + 2*padding >= screenH
      const minScale = screenH / (this.mapHeight - 100);

      // Begrenze das Reinzoomen (z.B. maximal 3x reinzoomen)
      const maxScale = 1.5;

      let newScale = this.scale.x * (e.deltaY < 0 ? 1.1 : 0.9);
      newScale = Math.max(minScale, Math.min(maxScale, newScale));
      this.scale.set(newScale);
      this.clampCameraPosition();
    });

    this.emit('ready');
  }

  public centerOnWorldCenter() {
    const world = this.world;
    const screenW = this.core.app.screen.width;
    const screenH = this.core.app.screen.height;

    world.x += screenW / 2;
    world.y += screenH / 2;

    // const gameArea = world.children[0] as any;

    // const allYs = [
    //   gameArea.topLeftSprite.y + -gameArea.topLeftSprite.height,
    //   gameArea.bottomLeftSprite.y,
    // ];
    // const topMost = Math.min(...allYs);
    // const bottomMost = Math.max(...allYs);
    // const mapHeight = bottomMost - topMost;
    // // this.minScale = screenH / mapHeight;
    // this.minScale = screenH / mapHeight;

    this.clampCameraPosition();
  }

  public clampCameraPosition(): void {
    const world = this.world;
    const scale = this.scale.x;
    const screenW = this.core.app.screen.width;
    const screenH = this.core.app.screen.height;

    const gameArea = world.children[0] as any;
    const gameAreaSprite = gameArea.gameAreaSprite;

    const paddingX = gameAreaSprite.width * 0.1;

    const allXs = [
      gameAreaSprite.x + -gameAreaSprite.width,
      gameAreaSprite.x + gameAreaSprite.width,
    ];

    const leftMost = Math.min(...allXs) * scale + -paddingX;
    const rightMost = Math.max(...allXs) * scale + paddingX;

    const allYs = [
      gameArea.topLeftSprite.y + -gameArea.topLeftSprite.height,
      gameArea.bottomLeftSprite.y,
    ];
    const topMost = Math.min(...allYs) * scale;
    const bottomMost = Math.max(...allYs) * scale;

    const minX = screenW - rightMost;
    const maxX = -leftMost;
    const minY = screenH - bottomMost;
    const maxY = -topMost;

    world.x = Math.max(minX, Math.min(maxX, world.x));
    world.y = Math.max(minY, Math.min(maxY, world.y));
  }

  public clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  public get world(): Container<ContainerChild> {
    return this.children[0];
  }
}
