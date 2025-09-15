import {
  Graphic,
  GRID_HEIGHT,
  GRID_WIDTH,
  TILE_GREEN,
  TILE_RED,
  TILE_SIZE,
  toIso,
} from '@coc/utils';
import { GameObject } from '../interface/game-object.abstract';

export type TileGraphicProps = {
  isDragging: boolean;
  tileX: number;
  tileY: number;
  tilesWidth?: number;
  tileHeight?: number;
};

export class TileGraphic extends Graphic {
  public override async render({
    isDragging = false,
    tileX,
    tileY,
    tilesWidth = 1,
    tileHeight = 1,
  }: TileGraphicProps): Promise<void> {
    this.clear();

    const color = this.isPlaceable(tileX, tileY) ? TILE_GREEN : TILE_RED;
    const alpha = 0.3;

    const { x, y } = toIso({ x: tileX, y: tileY });

    const anchorOffsetX = -0.5;
    const anchorOffsetY = 0.5;

    for (let dx = 0; dx < tilesWidth; dx++) {
      for (let dy = 0; dy < tileHeight; dy++) {
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
        this.lineStyle(2, color, 1);
        this.beginFill(color, alpha);
        this.drawPolygon(points);
        this.endFill();
        this.lineStyle(0);
      }
    }
  }

  public isPlaceable(tileX: number, tileY: number): boolean {
    const parent = this.parent;
    if (!(parent instanceof GameObject)) {
      return false;
    }
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX + parent.tilesWidth > GRID_WIDTH ||
      tileY + parent.tileHeight > GRID_HEIGHT
    ) {
      return false;
    }

    for (const child of this.children) {
      if (child === parent || !(child instanceof GameObject)) {
        continue;
      }

      const overlap =
        tileX < child.tileX + child.tilesWidth &&
        tileX + parent.tilesWidth > child.tileX &&
        tileY < child.tileY + child.tileHeight &&
        tileY + parent.tileHeight > child.tileY;

      if (overlap) {
        return false;
      }
    }

    return true;
  }
}
