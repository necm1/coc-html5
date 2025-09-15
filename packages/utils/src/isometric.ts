import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from './constants';
import { Vector2D } from './interface';

export function toIso(point: Vector2D): Vector2D {
  return {
    x: (point.x + point.y) * (TILE_SIZE / 2),
    y: (point.y - point.x) * (TILE_SIZE / 2.65),
  };
}

export function fromScreen(
  screenX: number,
  screenY: number,
  tileSize: number
): Vector2D {
  const isoX = screenX / (tileSize / 2);
  const isoY = screenY / (tileSize / 2.65);
  const x = (isoX - isoY) / 2;
  const y = (isoX + isoY) / 2;
  return { x, y };
}

export function toIsoCoord(
  x: number,
  y: number,
  tilesWidth: number,
  tilesHeight: number
): Vector2D {
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + tilesWidth > GRID_WIDTH) x = GRID_WIDTH - tilesWidth;
  if (y + tilesHeight > GRID_HEIGHT) y = GRID_HEIGHT - tilesHeight;

  return toIso({ x, y });
}
