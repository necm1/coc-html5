import { Entity } from '../interface/entity.interface';
import { Vector2D } from '../interface/vector2d.interface';
import { ScFile } from '../sc-file';

const DEFAULT_MULTIPLIER = 1024;
const PRECISE_MULTIPLIER = 65535;

export class Matrix2x3 extends Entity {
  public a = 1;
  public b = 0;
  public c = 0;
  public d = 1;
  public x = 0;
  public y = 0;

  constructor(partial: Partial<Matrix2x3> = {}) {
    super();

    this.a = partial.a ?? 1;
    this.b = partial.b ?? 0;
    this.c = partial.c ?? 0;
    this.d = partial.d ?? 1;
    this.x = partial.x ?? 0;
    this.y = partial.y ?? 0;

    // Object.assign(this, partial);
  }

  public override async load(file: ScFile, tag: number): Promise<void> {
    const reader = file.bufferReader;

    if (![8, 36].includes(tag)) {
      throw new Error(`Unsupported matrix tag: ${tag}`);
    }

    const divider = tag === 8 ? DEFAULT_MULTIPLIER : PRECISE_MULTIPLIER;

    this.a = reader.readInt32LE() / divider;
    this.b = reader.readInt32LE() / divider;
    this.c = reader.readInt32LE() / divider;
    this.d = reader.readInt32LE() / divider;
    this.x = reader.readInt32LE() / 20;
    this.y = reader.readInt32LE() / 20;
  }

  public applyX({ x, y }: Vector2D) {
    return x * this.a + y * this.c + this.x;
  }

  public applyY({ x, y }: Vector2D) {
    return y * this.d + x * this.b + this.y;
  }

  public multiply(matrix: Matrix2x3): Matrix2x3 {
    const a = this.a * matrix.a + this.b * matrix.c;
    const b = this.a * matrix.b + this.b * matrix.d;
    const c = this.d * matrix.d + this.c * matrix.b;
    const d = this.d * matrix.c + this.c * matrix.a;
    const x = matrix.applyX({ x: this.x, y: this.y });
    const y = matrix.applyY({ x: this.x, y: this.y });

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.x = x;
    this.y = y;

    return this;
  }

  public getAngleRadians(): number {
    return Math.atan2(this.b, this.a);
  }

  public getAngle(): number {
    return this.getAngleRadians() * (180 / Math.PI);
  }

  public getScale(): [number, number] {
    const scaleX = Math.hypot(this.a, this.b);
    const theta = this.getAngleRadians();

    const sinTheta = Math.sin(theta);

    let scaleY: number;

    if (Math.abs(sinTheta) <= 0.01) {
      scaleY = this.d / Math.cos(theta);
    } else {
      scaleY = this.c / sinTheta;
    }

    return [scaleX, scaleY];
  }

  public override toString(): string {
    return `Matrix2x3(a=${this.a}, b=${this.b}, c=${this.c}, d=${this.d}, x=${this.x}, y=${this.y})`;
  }
}
