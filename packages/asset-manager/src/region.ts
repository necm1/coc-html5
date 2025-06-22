import { ImageSource, Texture } from 'pixi.js';
import { Matrix2x3 } from './matrix2x3';
import { Rect } from './rect';
import { applyMatrix, comparePolygons, getRect } from './polygon';
import { Point } from './point';

function textureToCanvas(texture: Texture): HTMLCanvasElement | undefined {
  const source = texture.source.resource;

  if (!source) {
    return undefined;
  }

  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;

  const ctx = canvas.getContext('2d');

  if (!ctx) return undefined;

  ctx.drawImage(source, 0, 0);
  return canvas;
}

export class Region {
  public xyPoints: Point[] = [];
  public uvPoints: Point[] = [];
  public textureIndex = 0;
  public texture: Texture | null = null;
  public pointCount = 4;
  public rotation = 0;
  public isMirrored = false;
  public cacheImage: HTMLCanvasElement | null = null;

  public render(matrix: Matrix2x3): HTMLCanvasElement | undefined {
    const transformedPoints = applyMatrix(this.xyPoints, matrix);
    const rect = this.calculateBounds(matrix);
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);

    const renderedRegion = this.getImage();
    if (!renderedRegion) {
      return undefined;
    }

    if (renderedRegion.width + renderedRegion.height <= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.imageSmoothingEnabled = false;

      const srcCtx = renderedRegion.getContext('2d');

      if (!srcCtx) {
        console.warn(
          `Context for texture of region ${this.textureIndex} is not available`
        );
        return undefined;
      }

      const imageData = srcCtx.getImageData(0, 0, 1, 1).data;
      const color = `rgba(${imageData[0]},${imageData[1]},${imageData[2]},${
        imageData[3] / 255
      })`;
      ctx.beginPath();
      ctx.moveTo(
        transformedPoints[0].x - rect.left,
        transformedPoints[0].y - rect.top
      );
      for (let i = 1; i < transformedPoints.length; i++) {
        ctx.lineTo(
          transformedPoints[i].x - rect.left,
          transformedPoints[i].y - rect.top
        );
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      return ctx.canvas;
    }

    [this.rotation, this.isMirrored] = comparePolygons(
      transformedPoints,
      this.uvPoints
    );

    function getRotatedBoundingBox(w: number, h: number, angleDeg: number) {
      const angle = (angleDeg * Math.PI) / 180;
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));
      return {
        width: Math.ceil(w * cos + h * sin),
        height: Math.ceil(w * sin + h * cos),
      };
    }
    const rotatedBox = getRotatedBoundingBox(
      renderedRegion.width,
      renderedRegion.height,
      this.rotation
    );
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = rotatedBox.width;
    rotatedCanvas.height = rotatedBox.height;
    const rotatedCtx = rotatedCanvas.getContext('2d');

    if (!rotatedCtx) {
      throw new Error('Canvas context not available');
    }

    rotatedCtx.imageSmoothingEnabled = false;
    rotatedCtx.save();
    rotatedCtx.translate(rotatedBox.width / 2, rotatedBox.height / 2);
    rotatedCtx.rotate((this.rotation * Math.PI) / 180);
    rotatedCtx.drawImage(
      renderedRegion,
      -renderedRegion.width / 2,
      -renderedRegion.height / 2
    );
    rotatedCtx.restore();

    let mirroredCanvas = rotatedCanvas;
    if (this.isMirrored) {
      const mirrorCanvas = document.createElement('canvas');
      mirrorCanvas.width = rotatedCanvas.width;
      mirrorCanvas.height = rotatedCanvas.height;
      const mirrorCtx = mirrorCanvas.getContext('2d');

      if (!mirrorCtx) {
        throw new Error('Canvas context not available');
      }

      mirrorCtx.save();
      mirrorCtx.translate(mirroredCanvas.width, 0);
      mirrorCtx.scale(-1, 1);
      mirrorCtx.drawImage(rotatedCanvas, 0, 0);
      mirrorCtx.restore();
      mirroredCanvas = mirrorCanvas;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d');

    if (!outCtx) {
      throw new Error('Canvas context not available');
    }

    outCtx.drawImage(mirroredCanvas, 0, 0, width, height);

    return outCanvas;
  }

  public getImage(): HTMLCanvasElement | undefined {
    if (this.cacheImage) {
      return this.cacheImage;
    }

    console.log('texture', this.texture);

    if (!this.texture || !this.texture.source) {
      return undefined;
    }

    const rect = getRect(this.uvPoints);
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);

    // console.log(
    //   `Region: ${this.textureIndex}, Points: ${
    //     this.pointCount
    //   }, Rect: ${rect.asTuple()}`
    // );

    if (width + height <= 2) {
      const srcCanvas = textureToCanvas(this.texture);

      if (!srcCanvas) {
        console.warn(
          `Texture for region ${this.textureIndex} is not a valid canvas`
        );
        return undefined;
      }

      const srcCtx = srcCanvas.getContext('2d');

      if (!srcCtx) {
        console.warn(
          `Context for texture of region ${this.textureIndex} is not available`
        );
        return undefined;
      }

      const imageData = srcCtx.getImageData(
        Math.max(0, Math.round(rect.left)),
        Math.max(0, Math.round(rect.top)),
        1,
        1
      ).data;
      const color = `rgba(${imageData[0]},${imageData[1]},${imageData[2]},${
        imageData[3] / 255
      })`;

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return canvas;
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.texture.width;
    maskCanvas.height = this.texture.height;

    const maskCtx = maskCanvas.getContext('2d');

    if (!maskCtx) {
      throw new Error('Canvas context not available');
    }

    maskCtx.beginPath();
    maskCtx.moveTo(this.uvPoints[0].x, this.uvPoints[0].y);

    for (let i = 1; i < this.uvPoints.length; i++) {
      maskCtx.lineTo(this.uvPoints[i].x, this.uvPoints[i].y);
    }

    maskCtx.closePath();
    maskCtx.fillStyle = 'white';
    maskCtx.fill();

    const srcCanvas = textureToCanvas(this.texture);
    if (!srcCanvas) {
      console.warn(
        `Texture for region ${this.textureIndex} is not a valid canvas`
      );
      return undefined;
    }
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;

    const cropCtx = cropCanvas.getContext('2d');

    if (!cropCtx) {
      throw new Error('Canvas context not available');
    }

    cropCtx.drawImage(
      srcCanvas,
      rect.left,
      rect.top,
      width,
      height,
      0,
      0,
      width,
      height
    );

    const maskCrop = document.createElement('canvas');
    maskCrop.width = width;
    maskCrop.height = height;

    const maskCropCtx = maskCrop.getContext('2d');

    if (!maskCropCtx) {
      throw new Error('Canvas context not available');
    }

    maskCropCtx.drawImage(maskCanvas, -rect.left, -rect.top);
    cropCtx.globalCompositeOperation = 'destination-in';
    cropCtx.drawImage(maskCrop, 0, 0);

    this.cacheImage = cropCanvas;
    return cropCanvas;
  }

  public calculateBounds(matrix?: Matrix2x3 | null): Rect {
    const rect = getRect(applyMatrix(this.xyPoints, matrix));
    return new Rect({
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
    });
  }
}
