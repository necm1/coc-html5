import { Container, ContainerChild } from 'pixi.js';
import { ClashCore } from './core';

export class Camera extends Container {
  private dragging = false;
  private lastPos = { x: 0, y: 0 };

  private core: ClashCore = ClashCore.getInstance();

  constructor() {
    super();

    this.sortableChildren = true;
    this.interactiveChildren = true;

    this.hitArea = null;
    this.cursor = 'default';

    this.x = 0;
    this.y = 0;

    this.core.app.stage.addChild(this);
    this.registerEvents();
  }

  public registerEvents(): void {
    const canvas = this.core.canvas as unknown as HTMLCanvasElement;

    if (!canvas) {
      return;
    }

    canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.lastPos = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mouseup', () => (this.dragging = false));

    canvas.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        const dx = e.clientX - this.lastPos.x;
        const dy = e.clientY - this.lastPos.y;
        this.x += dx;
        this.y += dy;
        this.lastPos = { x: e.clientX, y: e.clientY };
        this.clamCameraPosition();
      }
    });

    canvas.addEventListener('wheel', (e) => {
      const world = this.world;
      const minZoom = Math.max(
        this.core.app.screen.width / world.width,
        this.core.app.screen.height / world.height
      );
      const maxZoom = 2.0;

      let newScale = this.scale.x * (e.deltaY < 0 ? 1.1 : 0.9);
      newScale = Math.max(minZoom, Math.min(maxZoom, newScale));
      this.scale.set(newScale);

      this.clamCameraPosition();
    });
  }

  public centerOnWorldCenter() {
    const world = this.world;

    const worldWidth = world.width;
    const worldHeight = world.height;

    const scale = this.scale.x;
    const targetX = this.core.app.screen.width / 2 - (worldWidth / 2) * scale;
    const targetY = this.core.app.screen.height / 2 - (worldHeight / 2) * scale;

    this.x = targetX;
    this.y = targetY;
    this.clamCameraPosition();
  }

  private clamCameraPosition(): void {
    const world = this.world;

    const minX = this.core.app.screen.width - (world.width * this.scale.x) / 2;
    const maxX = (world.width * this.scale.x) / 2;
    const minY =
      this.core.app.screen.height - (world.height * this.scale.y) / 2;
    const maxY = (world.height * this.scale.y) / 2;

    this.x = this.clamp(this.x, minX, maxX);
    this.y = this.clamp(this.y, minY, maxY);
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  public get world(): Container<ContainerChild> {
    return this.children[0];
  }
}
