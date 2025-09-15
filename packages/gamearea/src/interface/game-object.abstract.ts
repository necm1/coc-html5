import {
  ColorMatrixFilter,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Ticker,
} from 'pixi.js';
import { TilesContainer } from '../tiles.container';
import {
  fromScreen,
  TILE_GREEN,
  TILE_RED,
  TILE_SIZE,
  toIso,
  toIsoCoord,
} from '@coc/utils';

export abstract class GameObject extends Sprite {
  public override zIndex = 2;
  public type: string;
  public tileX: number;
  public tileY: number;
  private originalTileX?: number;
  private originalTileY?: number;

  public tileHeight: number;
  public tilesWidth: number;
  public readonly tileSize = 54;

  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private dragFilter: ColorMatrixFilter | null = null;
  private dragPulseTicker?: Ticker;
  private dragPulseTime = 0;

  private tilePreview?: Graphics;

  constructor() {
    super();

    this.eventMode = 'static';
    this.interactive = true;
    this.scale.set(0.92);
  }

  public async init(
    tileX: number,
    tileY: number,
    tileHeight: number,
    tileWidth: number
  ): Promise<void> {
    this.tileX = tileX;
    this.tileY = tileY;
    this.tileHeight = tileHeight;
    this.tilesWidth = tileWidth;
    this.zIndex = 3;

    await this.loadTextures();

    const parent: TilesContainer = this.parent as TilesContainer;
    const pos = toIsoCoord(tileX, tileY, this.tilesWidth, this.tileHeight);

    this.position.set(pos.x, pos.y);
  }

  public async loadTextures(): Promise<void> {
    throw new Error('loadTextures method must be implemented in subclasses');
  }

  updateScreenPosition() {
    const parent = this.parent as TilesContainer;
    const { x, y } = toIso({ x: this.tileX, y: this.tileY });
    this.position.set(x, y);
  }

  public onDragStart(event: FederatedPointerEvent) {
    this.dragging = true;

    if (!this.dragFilter) {
      this.dragFilter = new ColorMatrixFilter();
    }
    this.filters = [this.dragFilter];

    this.dragPulseTime = -Math.PI / 2;
    this.dragPulseTicker = new Ticker();
    this.dragPulseTicker.add(() => {
      this.dragPulseTime += 0.018;
      const brightness = 0.85 + Math.sin(this.dragPulseTime) * 0.15;

      this.dragFilter?.brightness(brightness, false);
    });
    this.dragPulseTicker.start();

    if (!this.tilePreview) {
      this.tilePreview = new Graphics();
      (this.parent as TilesContainer).addChildAt(this.tilePreview, 0);
    }

    this.originalTileX = this.tileX;
    this.originalTileY = this.tileY;

    this.tilePreview.visible = true;
    this.updateTilePreview(true);

    const parent = this.parent as TilesContainer;
    const parentPos = event.getLocalPosition(parent);

    const { x: tileX, y: tileY } = fromScreen(
      parentPos.x,
      parentPos.y,
      TILE_SIZE
    );
    this.dragOffset = {
      x: this.tileX - tileX,
      y: this.tileY - tileY,
    };
    this.emit('dragstart', this);
  }

  public onDragMove(event: FederatedPointerEvent) {
    if (!this.dragging || !this.parent) return;
    const parent = this.parent as TilesContainer;
    const parentPos = event.getLocalPosition(parent);

    const { x: tileX, y: tileY } = fromScreen(
      parentPos.x,
      parentPos.y,
      TILE_SIZE
    );
    const snappedX = Math.round(tileX + this.dragOffset.x);
    const snappedY = Math.round(tileY + this.dragOffset.y);

    const maxX = parent.gridWidth - this.tilesWidth;
    const maxY = parent.gridHeight - this.tileHeight;

    const currentTileX = Math.max(0, Math.min(snappedX, maxX));
    const currentTileY = Math.max(0, Math.min(snappedY, maxY));

    this.tileX = Math.max(0, Math.min(snappedX, maxX));
    this.tileY = Math.max(0, Math.min(snappedY, maxY));

    this.updateScreenPosition();

    const isPlaceable = parent.isPlaceable(this, this.tileX, this.tileY);
    this.updateTilePreview(isPlaceable);
    this.emit('dragmove', this, this.tileX, this.tileY);
  }

  public onDragEnd() {
    this.dragging = false;

    if (this.dragPulseTicker) {
      this.dragPulseTicker.stop();
      this.dragPulseTicker.destroy();
      this.dragPulseTicker = undefined;
    }

    this.filters = [];
    this.alpha = 1;

    const parent = this.parent as TilesContainer;
    if (!parent.isPlaceable(this, this.tileX, this.tileY)) {
      if (
        this.originalTileX !== undefined &&
        this.originalTileY !== undefined
      ) {
        this.tileX = this.originalTileX;
        this.tileY = this.originalTileY;
        this.updateScreenPosition();
      }
    }

    if (this.tilePreview) this.tilePreview.visible = false;

    this.emit('dragend', this);
  }

  private updateTilePreview(isPlaceable: boolean, isDragging = false) {
    if (!this.tilePreview) {
      return;
    }
    this.tilePreview.clear();

    const color = isPlaceable ? TILE_GREEN : TILE_RED;
    const alpha = 0.3;

    const parent = this.parent as TilesContainer;
    const { x, y } = toIso({ x: this.tileX, y: this.tileY });
    this.tilePreview.position.set(x, y);

    const anchorOffsetX = -0.5;
    const anchorOffsetY = 0.5;

    for (let dx = 0; dx < this.tilesWidth; dx++) {
      for (let dy = 0; dy < this.tileHeight; dy++) {
        const { x: relX, y: relY } = toIso({
          x: dx - anchorOffsetX,
          y: dy - anchorOffsetY,
        });
        const ts = TILE_SIZE;
        const points = [
          relX,
          relY + ts / 2.65,
          relX + ts / 2,
          relY,
          relX + ts,
          relY + ts / 2.65,
          relX + ts / 2,
          relY + ts / 1.325,
        ];
        this.tilePreview.lineStyle(2, color, 1);
        this.tilePreview.beginFill(color, alpha);
        this.tilePreview.drawPolygon(points);
        this.tilePreview.endFill();
        this.tilePreview.lineStyle(0);
      }
    }
  }
}
