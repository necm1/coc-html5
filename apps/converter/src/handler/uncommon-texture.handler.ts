import { existsSync } from 'fs';
import { Handler, HandlerProps } from '../interface/handler.interface';

export class UncommonTextureHandler extends Handler {
  public async canHandle(tag: number): Promise<boolean> {
    return tag === 30;
  }

  public override async handle({ file }: HandlerProps): Promise<void> {
    file.useCommonTexture = true;

    const basePath = String(file.filePath).slice(0, -3);

    const highresTexturePath = basePath + file.highResSuffix + '_tex.sc';
    const lowresTexturePath = basePath + file.lowResSuffix + '_tex.sc';

    file.uncommonTexturePath = highresTexturePath;

    if (!existsSync(highresTexturePath) && existsSync(lowresTexturePath)) {
      file.uncommonTexturePath = lowresTexturePath;
      file.useLowresTexture = true;
    }
  }
}
