export class Point {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  equals(other: any): boolean {
    return other instanceof Point && this.x === other.x && this.y === other.y;
  }

  multiply(other: number): Point {
    this.x *= other;
    this.y *= other;
    return this;
  }

  add(other: Point): Point {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  sub(other: Point): Point {
    return this.add(other.neg());
  }

  neg(): Point {
    this.x *= -1;
    this.y *= -1;
    return this;
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  asTuple(): [number, number] {
    return [this.x, this.y];
  }
}
