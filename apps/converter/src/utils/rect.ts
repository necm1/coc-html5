export class Rect {
  public left: number;
  public top: number;
  public right: number;
  public bottom: number;

  constructor({
    left = 0,
    top = 0,
    right = 0,
    bottom = 0,
  }: { left?: number; top?: number; right?: number; bottom?: number } = {}) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  get width(): number {
    return this.right - this.left;
  }

  get height(): number {
    return this.bottom - this.top;
  }

  asTuple(): [number, number, number, number] {
    return [this.left, this.top, this.right, this.bottom];
  }

  addPoint(x: number, y: number): void {
    if (x < this.left) {
      this.left = x;
    }
    if (x > this.right) {
      this.right = x;
    }
    if (y < this.top) {
      this.top = y;
    }
    if (y > this.bottom) {
      this.bottom = y;
    }
  }

  mergeBounds(other: Rect): void {
    if (other.left < this.left) {
      this.left = other.left;
    }
    if (other.right > this.right) {
      this.right = other.right;
    }
    if (other.top < this.top) {
      this.top = other.top;
    }
    if (other.bottom > this.bottom) {
      this.bottom = other.bottom;
    }
  }

  toString(): string {
    return `Rect(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`;
  }
}
