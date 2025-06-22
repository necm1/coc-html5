import { Canvas, createCanvas } from 'canvas';
import { Matrix2x3 } from '../entity/matrix2x3.entity';
import { Region } from '../entity/region.entity';
import { Shape } from '../entity/shape.entity';
import { Renderer } from '../interface/renderer.interface';
import { Rect } from '../utils/rect';

export class ShapeRenderer extends Renderer {
  private _id: number;
  private _regions: Region[] = [];

  constructor(shape: Shape) {
    super();
    this._id = shape.id;
    this._regions = shape.regions;
  }

  public override async render(matrix: Matrix2x3): Promise<Canvas> {
    const matrixMultiplied = this.matrix;
    matrixMultiplied.multiply(matrix);

    const bounds = this.calculateBounds(matrix);

    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (const region of this._regions) {
      const renderedRegion = region.render(matrixMultiplied);

      if (!renderedRegion) {
        continue;
      }

      const regionBounds = region.calculateBounds(matrixMultiplied);

      const x = Math.round(regionBounds.left - bounds.left);
      const y = Math.round(regionBounds.top - bounds.top);

      ctx.drawImage(renderedRegion, x, y);
    }

    return canvas;
  }

  public override calculateBounds(matrix: Matrix2x3): Rect {
    const matrixMultiplied = this.matrix;
    matrixMultiplied.multiply(matrix);

    const rect = new Rect();

    for (const region of this._regions) {
      rect.mergeBounds(region.calculateBounds(matrixMultiplied));
    }

    rect.left = Math.round(rect.left);
    rect.top = Math.round(rect.top);
    rect.right = Math.round(rect.right);
    rect.bottom = Math.round(rect.bottom);

    return rect;
  }
}
