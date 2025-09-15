import { Handler, HandlerProps } from '../interface/handler.interface';
import { Texture } from '../entity/texture.entity';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { join, basename, dirname } from 'path';
import { execFile } from 'child_process';
import sharp from 'sharp';
import {
  HandlerEventEmitter,
  HandlerEventType,
} from '../handler.event-emitter';

export class TextureHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return [1, 16, 28, 29, 34, 19, 24, 27, 45, 47].includes(tag);
  }

  public override async handle({
    file,
    tag,
    textureId,
  }: HandlerProps): Promise<void> {
    if (typeof textureId !== 'number') {
      return;
    }

    let texture: Texture;

    if (file.textures[textureId]) {
      texture = file.textures[textureId];
      await texture.load(file, tag);
    } else {
      texture = new Texture();
      await texture.load(file, tag);
      file.textures[textureId] = texture;
    }

    HandlerEventEmitter.getInstance().emit('afterHandle', {
      type: HandlerEventType.ADD_TEXTURE,
      args: [],
    });
  }
}
