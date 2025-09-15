import { Canvas, createCanvas } from 'canvas';
import { Entity } from '../interface/entity.interface';
import { ScFile } from '../sc-file';
import { Point } from '../utils/point';
import { applyMatrix, comparePolygons, getRect } from '../utils/polygon';
import { Rect } from '../utils/rect';
import { Matrix2x3 } from './matrix2x3.entity';
import { Texture } from './texture.entity';

export class Region extends Entity {
  public xyPoints: Point[] = [];
  public uvPoints: Point[] = [];
  public textureIndex = 0;
  public texture: Texture | null = null;
  public pointCount = 4;
  public cacheImage: Canvas | null = null;
  public rotation = 0;
  public isMirrored = false;

  public override async load(file: ScFile, tag: number): Promise<void> {
    const reader = file.bufferReader;

    this.textureIndex = reader.readByte();
    this.texture = file.textures[this.textureIndex];

    if (tag !== 4) {
      this.pointCount = reader.readByte();
    }

    this.xyPoints = Array.from({ length: this.pointCount }, () => new Point());
    this.uvPoints = Array.from({ length: this.pointCount }, () => new Point());

    for (let i = 0; i < this.pointCount; i++) {
      const x = reader.readInt32LE() / 20;
      const y = reader.readInt32LE() / 20;
      this.xyPoints[i] = new Point(x, y);
    }

    for (let i = 0; i < this.pointCount; i++) {
      let u, v;

      if (tag === 4) {
        u = (reader.readUInt16LE() * 0xffff) / this.texture.width;
        v = (reader.readUInt16LE() * 0xffff) / this.texture.height;
      } else {
        u = (reader.readUInt16LE() * this.texture.width) / 0xffff;
        v = (reader.readUInt16LE() * this.texture.height) / 0xffff;
      }

      if (file.useLowresTexture) {
        u *= 0.5;
        v *= 0.5;
      } else {
        u *= 1;
        v *= 1;
      }

      this.uvPoints[i] = new Point(u, v);
    }
  }

  public render(matrix: Matrix2x3): Canvas | undefined {
    const transformedPoints = applyMatrix(this.xyPoints, matrix);
    const rect = this.calculateBounds(matrix);
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);

    const renderedRegion = this.getImage();
    if (!renderedRegion) {
      return undefined;
    }

    if (renderedRegion.width + renderedRegion.height <= 2) {
      const ctx = createCanvas(width, height).getContext('2d');
      ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
      const srcCtx = renderedRegion.getContext('2d');
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
    const rotatedCanvas = createCanvas(rotatedBox.width, rotatedBox.height);
    const rotatedCtx = rotatedCanvas.getContext('2d');
    rotatedCtx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
    rotatedCtx.save();
    rotatedCtx.translate(rotatedBox.width / 2, rotatedBox.height / 2);
    rotatedCtx.rotate((this.rotation * Math.PI) / 180); // Negatives Vorzeichen wie in region.py
    rotatedCtx.drawImage(
      renderedRegion,
      -renderedRegion.width / 2,
      -renderedRegion.height / 2
    );
    rotatedCtx.restore();

    let mirroredCanvas = rotatedCanvas;
    if (this.isMirrored) {
      const mirrorCanvas = createCanvas(
        rotatedCanvas.width,
        rotatedCanvas.height
      );
      const mirrorCtx = mirrorCanvas.getContext('2d');
      mirrorCtx.save();
      mirrorCtx.translate(mirrorCanvas.width, 0);
      mirrorCtx.scale(-1, 1);
      mirrorCtx.drawImage(rotatedCanvas, 0, 0);
      mirrorCtx.restore();
      mirroredCanvas = mirrorCanvas;
    }

    const outCanvas = createCanvas(width, height);
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(mirroredCanvas, 0, 0, width, height);

    return outCanvas;
  }

  public getImage(): Canvas | undefined {
    if (this.cacheImage) {
      return this.cacheImage;
    }

    if (!this.texture || !this.texture.image) {
      return undefined;
    }

    const rect = getRect(this.uvPoints);
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);

    if (width + height <= 2) {
      const srcCanvas = this.texture.image;
      const srcCtx = srcCanvas.getContext('2d');
      const imageData = srcCtx.getImageData(
        Math.max(0, Math.round(rect.left)),
        Math.max(0, Math.round(rect.top)),
        1,
        1
      ).data;
      const color = `rgba(${imageData[0]},${imageData[1]},${imageData[2]},${
        imageData[3] / 255
      })`;

      const canvas = createCanvas(1, 1);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return canvas;
    }

    const maskCanvas = createCanvas(this.texture.width, this.texture.height);
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.beginPath();
    maskCtx.moveTo(this.uvPoints[0].x, this.uvPoints[0].y);
    for (let i = 1; i < this.uvPoints.length; i++) {
      maskCtx.lineTo(this.uvPoints[i].x, this.uvPoints[i].y);
    }
    maskCtx.closePath();
    maskCtx.fillStyle = 'white';
    maskCtx.fill();

    const srcCanvas = this.texture.image;
    // console.log(srcCanvas.toDataURL());
    const cropCanvas = createCanvas(width, height);
    const cropCtx = cropCanvas.getContext('2d');
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

    // console.log('Crop', cropCanvas.toDataURL());

    const maskCrop = createCanvas(width, height);
    const maskCropCtx = maskCrop.getContext('2d');
    maskCropCtx.drawImage(maskCanvas, -rect.left, -rect.top);
    cropCtx.globalCompositeOperation = 'destination-in';
    cropCtx.drawImage(maskCrop, 0, 0);

    // console.log('Crop with mask', cropCanvas.toDataURL());

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
