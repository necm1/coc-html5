import { Canvas, createCanvas } from 'canvas';
import { Matrix2x3 } from '../entity/matrix2x3.entity';
import { MovieClip } from '../entity/movie-clip.entity';
import { MovieClipFrame } from '../entity/movie-clip-frame.entity';
import { Renderer } from '../interface/renderer.interface';
import { ScFile } from '../sc-file';
import { Matrix } from '../entity/matrix.entity';
import { Rect } from '../utils/rect';
import { ColorTransform } from '../entity/color-transform.entity';

export class MovieClipRenderer extends Renderer {
  private id = -1;
  private exportName: string | null = null;
  private fps = 30;
  private frameCount = 0;
  private frames: MovieClipFrame[] = [];
  private frameElements: [number, number, number][] = [];
  private blends: number[] = [];
  private binds: number[] = [];
  private children: Renderer[] = [];
  private frameChildren: Renderer[] = [];
  private matrixItem: Matrix | null = null;

  constructor(
    private readonly movieClip: MovieClip,
    private readonly scFile: ScFile
  ) {
    super();
    this.init();

    this.id = movieClip.id;
    this.exportName = movieClip.exportName;
    this.fps = movieClip.fps;
    this.frameCount = movieClip.frameCount;
    this.frames = movieClip.frames;
    this.frameElements = movieClip.frameElements;
    this.binds = movieClip.binds;
    this.blends = movieClip.blends;

    const matrix = this.scFile.matrices[movieClip.matrixIndex];

    if (matrix) {
      this.matrixItem = this.scFile.matrices[movieClip.matrixIndex];
    }

    this.setFrame(0);
  }

  public init(): void {
    // for (const bindId of this.movieClip.binds) {
    //   const bind = this.scFile.getRendererItem(Number(bindId));

    //   let item: Renderer | null = null;
    //   if (bind) {
    //     item = bind;
    //   }

    //   this.children.push(item);
    // }
    this.children = [];

    for (const bindId of this.movieClip.binds) {
      const bindObject = this.scFile.getRendererItem(bindId);

      let displayObject: Renderer | null = null;

      if (bindObject !== null) {
        displayObject = bindObject;
        this.children.push(displayObject);
      }
    }
  }

  public override async render(matrix: Matrix2x3): Promise<Canvas> {
    const matrixMultiplied = new Matrix2x3(this.matrix);
    matrixMultiplied.multiply(matrix);

    const bounds = this.calculateBounds(matrixMultiplied);

    // const width = Math.max(1, Math.round(bounds.width));
    // const height = Math.max(1, Math.round(bounds.height));
    const width = Math.round(bounds.width);
    const height = Math.round(bounds.height);

    console.log(
      `Rendering MovieClip ${this.id} (${this.exportName}) at ${width}x${height}`
    );
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (const child of this.frameChildren) {
      const renderedChild = await child.render(matrixMultiplied);
      const childBounds = child.calculateBounds(matrixMultiplied);

      if (!renderedChild) {
        continue;
      }

      const x = childBounds.left - bounds.left;
      const y = childBounds.top - bounds.top;

      ctx.drawImage(renderedChild, x, y);
    }

    return canvas;
  }

  public override calculateBounds(matrix: Matrix2x3) {
    const matrixMultiplied = new Matrix2x3(this.matrix);
    matrixMultiplied.multiply(matrix);

    const rect = new Rect();

    for (const child of this.frameChildren) {
      const childBounds = child.calculateBounds(matrixMultiplied);
      console.log(`Child bounds:`, childBounds);
      rect.mergeBounds(childBounds);
    }

    rect.left = Math.round(rect.left);
    rect.top = Math.round(rect.top);
    rect.right = Math.round(rect.right);
    rect.bottom = Math.round(rect.bottom);

    return rect;
  }

  public setFrame(frameIndex: number): void {
    if (!this.matrixItem) {
      throw new Error('Matrix is not set');
    }

    this.frameChildren = [];
    const frame = this.frames[frameIndex];
    for (const [
      childIndex,
      matrixIndex,
      colorTransformIndex,
    ] of frame.getElements()) {
      console.log(
        `Frame uses childIndex: ${childIndex}, matrixIndex: ${matrixIndex}, colorTransformIndex: ${colorTransformIndex}`
      );

      let matrix = new Matrix2x3();
      if (matrixIndex !== 0xffff) {
        matrix = this.matrixItem.getMatrix(matrixIndex);
      }

      let colorTransform = new ColorTransform();
      if (colorTransformIndex !== 0xffff) {
        colorTransform = this.matrixItem.getColorTransform(colorTransformIndex);
      }

      const child = this.children[childIndex];

      if (!child) {
        continue;
      }

      if (child instanceof MovieClipRenderer) {
        console.log(
          `Setting frame for MovieClipRenderer ${child.id} (${child.exportName})`
        );
      }

      child.setMatrix(matrix);
      child.setColorTransform(colorTransform);

      this.frameChildren.push(child);
    }
  }
}
