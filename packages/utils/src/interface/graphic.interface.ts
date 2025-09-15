import { Graphics } from 'pixi.js';

export abstract class Graphic<T = unknown> extends Graphics {
  public async render(props: T): Promise<void> {
    throw new Error('Render method not implemented');
  }
}
