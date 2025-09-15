import { ColorTransform } from '../entity/color-transform.entity';
import { Matrix2x3 } from '../entity/matrix2x3.entity';

export abstract class Renderer {
  private _matrix = new Matrix2x3();
  private _colorTransform = new ColorTransform();

  public abstract render(matrix: Matrix2x3): Promise<any>;
  public abstract calculateBounds(matrix: Matrix2x3): any;

  public setMatrix(matrix: Matrix2x3): void {
    this._matrix = matrix;
  }

  public setColorTransform(colorTransform: ColorTransform): void {
    this._colorTransform = colorTransform;
  }

  public get matrix(): Matrix2x3 {
    return this._matrix;
  }
  public get colorTransform(): ColorTransform {
    return this._colorTransform;
  }
}
