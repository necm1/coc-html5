import { Matrix2x3 } from './matrix2x3';
import { Rect } from './rect';
import { Region } from './region';

export class ShapeRenderer {
  private _regions: Region[] = [];
  public matrix: Matrix2x3 = new Matrix2x3();

  constructor(
    private readonly textures: Record<string, any>,
    private readonly assetName: string
  ) {}

  public async render(matrix: Matrix2x3): Promise<any> {
    const matrixMultiplied = this.matrix;
    matrixMultiplied.multiply(matrix);

    const bounds = this.calculateBounds(matrix);

    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    ctx.imageSmoothingEnabled = false;

    for (const region of this._regions) {
      const renderedRegion = region.render(matrixMultiplied);

      if (!renderedRegion) {
        console.log(`Region ${region.textureIndex} could not be rendered`);
        continue;
      }

      const regionBounds = region.calculateBounds(matrixMultiplied);

      const x = Math.round(regionBounds.left - bounds.left);
      const y = Math.round(regionBounds.top - bounds.top);

      ctx.drawImage(renderedRegion, x, y);
    }

    return canvas;
  }

  public calculateBounds(matrix: Matrix2x3): Rect {
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
  public set regions(value: any[]) {
    if (!Array.isArray(value)) {
      throw new Error('Regions must be an array');
    }

    const regions = value.map((regionEntry) => {
      const region = new Region();

      region.xyPoints = regionEntry.xyPoints;
      region.uvPoints = regionEntry.uvPoints;
      region.textureIndex = regionEntry.textureIndex;
      region.texture =
        this.textures[`${this.assetName}/${regionEntry.imageFile}`] || null;
      region.rotation = regionEntry.rotation || 0;
      region.isMirrored = regionEntry.mirrored || false;
      return region;
    });

    this._regions = regions;
  }
}
