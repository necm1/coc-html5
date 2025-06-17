import { HandlerEventEmitter } from '../handler.event-emitter';
import { ScFile } from '../sc-file';

export type HandlerProps = {
  file: ScFile;
  tag: number;
  hasTexture?: boolean;
  textureId?: number;
  length: number;
};

export abstract class Handler {
  private readonly eventEmitter: HandlerEventEmitter;

  public abstract canHandle(...args: any[]): Promise<boolean>;

  public async handle({
    file,
    tag,
    hasTexture,
    textureId,
  }: HandlerProps): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
