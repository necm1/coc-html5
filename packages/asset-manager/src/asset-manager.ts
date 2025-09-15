import { Assets, Texture } from 'pixi.js';
import { ShapeRenderer } from './shape-renderer';
import { Matrix2x3 } from './matrix2x3';
import { Logger } from '@coc/utils';

interface RegionData {
  regionIndex: number;
  imageFile: string;
  xyPoints: { x: number; y: number }[];
  uvPoints: { x: number; y: number }[];
  mirrored: boolean;
  rotation: number;
  textureIndex: number;
  pointCount: number;
  shapeId?: number;
}

interface AssetJson {
  regions: RegionData[];
}

export class AssetManager {
  private static readonly logger: Logger = new Logger(AssetManager.name);

  private static loadedJson: Record<string, AssetJson> = {};
  private static loadedTextures: Record<string, Texture> = {};
  private static shapeTextureCache: Record<string, Texture> = {};

  static async add(name: string): Promise<void> {
    if (this.loadedJson[name]) return;

    const jsonUrl = `assets/${name}/${name}.json`;
    const response = await fetch(jsonUrl);
    const data = await response.json();

    const allRegions: RegionData[] = [];

    for (const entry of data) {
      if (!entry.regions || !Array.isArray(entry.regions)) continue;
      for (const region of entry.regions) {
        region.shapeId = entry.shapeId;
        allRegions.push(region);
      }
    }

    this.loadedJson[name] = { regions: allRegions };
    this.logger.info(
      `Asset "${name}" loaded with ${allRegions.length} regions`
    );

    const uniqueShapeIds = [
      ...new Set(allRegions.map((r) => r.shapeId?.toString())),
    ];
    await Promise.all(
      uniqueShapeIds.map(async (shapeId) => {
        if (shapeId) {
          await this.generateAndCacheShapeTexture(name, shapeId);
          this.logger.debug(
            `Shape texture for ${name}/${shapeId} generated and cached`
          );
        }
      })
    );
  }

  static getJson(name: string): AssetJson | undefined {
    return this.loadedJson[name];
  }

  static getTexture(assetName: string, imageFile: string): Texture | undefined {
    return this.loadedTextures[`${assetName}/${imageFile}`];
  }

  static async get(
    assetName: string,
    regionName: string
  ): Promise<Texture | undefined> {
    const cacheKey = `${assetName}/${regionName}`;
    if (this.shapeTextureCache[cacheKey]) {
      return this.shapeTextureCache[cacheKey];
    }

    return await this.generateAndCacheShapeTexture(assetName, regionName);
  }

  private static async generateAndCacheShapeTexture(
    assetName: string,
    regionName: string
  ): Promise<Texture | undefined> {
    const asset = this.getJson(assetName);

    if (!asset) {
      this.logger.warn(`Asset ${assetName} not found`);
      return undefined;
    }

    const regions = asset.regions.filter(
      (r) => r.shapeId === Number(regionName)
    );
    if (!regions.length) {
      return undefined;
    }

    await Promise.all(
      regions.map(async (region) => {
        const texKey = `${assetName}/${region.imageFile}`;
        if (this.loadedTextures[texKey]) return;
        const texture = await Assets.load(
          `assets/${assetName}/regions/${region.imageFile}`
        );

        this.loadedTextures[texKey] = texture;
      })
    );

    const shapeTextures = Object.fromEntries(
      Object.entries(this.loadedTextures).filter(([key]) =>
        key.startsWith(assetName)
      )
    );

    const shapeRenderer = new ShapeRenderer(shapeTextures, assetName);
    shapeRenderer.regions = regions;

    const matrix = new Matrix2x3();
    const canvas = await shapeRenderer.render(matrix);

    if (!canvas) {
      this.logger.warn(
        `Failed to render regions for ${assetName}/${regionName}`
      );
      return undefined;
    }

    const texture = Texture.from(canvas);
    this.shapeTextureCache[`${assetName}/${regionName}`] = texture;
    return texture;
  }
}
