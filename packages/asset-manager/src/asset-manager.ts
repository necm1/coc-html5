import { Assets, Texture } from 'pixi.js';
import { ShapeRenderer } from './shape-renderer';
import { Matrix2x3 } from './matrix2x3';

interface RegionData {
  name: string;
  imageFile: string;
  xyPoints: { x: number; y: number }[];
  uvPoints: { x: number; y: number }[];
  shapeId?: number;
  regionIndex?: number;
}

interface AssetJson {
  regions: RegionData[];
}

export class AssetManager {
  private static loadedJson: Record<string, AssetJson> = {};
  private static loadedTextures: Record<string, Texture> = {};

  static async add(name: string): Promise<void> {
    if (this.loadedJson[name]) return;

    const jsonUrl = `assets/${name}/${name}.json`;
    const response = await fetch(jsonUrl);
    const data = await response.json();

    const allRegions: RegionData[] = [];
    for (const entry of data) {
      if (Array.isArray(entry.regions)) {
        for (const region of entry.regions) {
          region.shapeId = entry.shapeId;
          if (!region.name) {
            region.name = `${entry.shapeId}_${region.regionIndex}`;
          }
          allRegions.push(region);
        }
      }
    }
    this.loadedJson[name] = { regions: allRegions };

    console.log(
      await this.getShapeTexture('background_gamearea', '0'),
      this.loadedTextures
    );
  }

  static getJson(name: string): AssetJson | undefined {
    return this.loadedJson[name];
  }

  static getTexture(assetName: string, imageFile: string): Texture | undefined {
    return this.loadedTextures[`${assetName}/${imageFile}`];
  }

  static async getShapeTexture(
    assetName: string,
    regionName: string
  ): Promise<Texture | undefined> {
    const asset = this.getJson(assetName);

    if (!asset) {
      console.warn(`Asset ${assetName} not found`);
      return undefined;
    }

    let regions: RegionData[];

    if (/^\d+$/.test(regionName)) {
      const shapeId = parseInt(regionName);
      regions = asset.regions.filter((r) => r.shapeId === shapeId);

      regions.sort((a, b) => (a.regionIndex ?? 0) - (b.regionIndex ?? 0));

      if (regions.length === 0) {
        return undefined;
      }
    } else {
      const multiRegionPrefix = regionName + '_';
      const matchingRegions = asset.regions.filter((r) =>
        r.name.startsWith(multiRegionPrefix)
      );
      if (matchingRegions.length > 0) {
        regions = matchingRegions.slice().sort((a, b) => {
          const na = parseInt(a.name.replace(multiRegionPrefix, ''));
          const nb = parseInt(b.name.replace(multiRegionPrefix, ''));
          return na - nb;
        });
      } else {
        const region = asset.regions.find((r) => r.name === regionName);
        if (!region) {
          console.warn(`Region ${regionName} not found in asset ${assetName}`);
          return undefined;
        }
        regions = [region];
      }
    }

    for (const region of regions) {
      const texKey = `${assetName}/${region.imageFile}`;
      if (!this.loadedTextures[texKey]) {
        const texture = await Assets.load(
          `assets/${assetName}/regions/${region.imageFile}`
        );
        this.loadedTextures[texKey] = texture;
      }
    }

    const matrix = new Matrix2x3();

    const shapeRenderer = new ShapeRenderer(this.loadedTextures, assetName);
    shapeRenderer.matrix = matrix;
    shapeRenderer.regions = regions;

    const canvas = await shapeRenderer.render(matrix);

    if (!canvas) {
      console.warn(`Failed to render regions for ${assetName}/${regionName}`);
      return undefined;
    }

    return Texture.from(canvas);
  }
}
