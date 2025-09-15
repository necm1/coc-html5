import { Entity } from '../interface/entity.interface';
import { ColorTransform } from './color-transform.entity';
import { Matrix2x3 } from './matrix2x3.entity';

export class Matrix extends Entity {
  public readonly matrices: Matrix2x3[] = [];
  public readonly colorTransformations: ColorTransform[] = [];

  public override async load(
    matrixCount: number,
    colorTransformationCount: number
  ): Promise<void> {
    for (let i = 0; i < matrixCount; i++) {
      this.matrices.push(new Matrix2x3());
    }

    for (let i = 0; i < colorTransformationCount; i++) {
      this.colorTransformations.push(new ColorTransform());
    }
  }

  public getMatrix(index: number): Matrix2x3 {
    if (index < 0 || index >= this.matrices.length) {
      throw new Error(`Matrix index out of bounds: ${index}`);
    }

    return this.matrices[index];
  }

  public getColorTransform(index: number): ColorTransform {
    if (index < 0 || index >= this.colorTransformations.length) {
      throw new Error(`Color transformation index out of bounds: ${index}`);
    }

    return this.colorTransformations[index];
  }
}
