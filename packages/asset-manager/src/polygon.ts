import { Matrix2x3 } from './matrix2x3';
import { Point } from './point';
import { Rect } from './rect';
import { createCanvas, Canvas } from 'canvas';

export type Polygon = Point[];

export enum PointOrder {
  CLOCKWISE = 0,
  COUNTER_CLOCKWISE = 1,
}

export function getPolygonSumOfEdges(polygon: Polygon): number {
  let pointsSum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    pointsSum += (p2.x - p1.x) * (p1.y + p2.y);
  }
  return pointsSum;
}

export function getPolygonPointOrder(polygon: Polygon): PointOrder | null {
  const sumOfEdges = getPolygonSumOfEdges(polygon);
  if (sumOfEdges > 0) {
    return PointOrder.CLOCKWISE;
  } else if (sumOfEdges < 0) {
    return PointOrder.COUNTER_CLOCKWISE;
  }
  return null;
}

export function comparePolygons(
  polygon1: Polygon,
  polygon2: Polygon
): [number, boolean] {
  // Calculates rotation and if polygon is mirrored.
  const polygon1Order = getPolygonPointOrder(polygon1);
  const polygon2Order = getPolygonPointOrder(polygon2);
  const mirroring = polygon1Order !== polygon2Order;

  const dx = (polygon1[1].x - polygon1[0].x) * (mirroring ? -1 : 1);
  const dy = polygon1[1].y - polygon1[0].y;
  const du = polygon2[1].x - polygon2[0].x;
  const dv = polygon2[1].y - polygon2[0].y;

  // Solution from https://stackoverflow.com/a/21484228/14915825
  const angleRadians = Math.atan2(dy, dx) - Math.atan2(dv, du);
  const angle = (angleRadians * 180) / Math.PI;

  return [angle, mirroring];
}

export function getRect(polygon: Polygon): Rect {
  // Calculates polygon bounds and returns rect.
  const rect = new Rect({
    left: 100000,
    top: 100000,
    right: -100000,
    bottom: -100000,
  });
  for (const point of polygon) {
    rect.addPoint(point.x, point.y);
  }
  return rect;
}

export function applyMatrix(
  polygon: Polygon,
  matrix?: Matrix2x3 | null
): Polygon {
  if (!matrix) return polygon;
  return polygon.map(
    (point) =>
      new Point(
        matrix.applyX({ x: point.x, y: point.y }),
        matrix.applyY({ x: point.x, y: point.y })
      )
  );
}

export function createFilledPolygonImage(
  width: number,
  height: number,
  polygon: { x: number; y: number }[],
  color = 'rgba(255,255,255,1)'
): Canvas {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  return canvas;
}
